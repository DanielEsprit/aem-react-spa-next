#!/usr/bin/env node
/*
 * Part of aem-react-spa-next, a derivative of adobe/aem-react-spa; see NOTICE.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/**
 * Scans an existing AEM SPA component codebase for patterns that break (or need attention)
 * when the components are server-rendered and hydrated by Next.js. Read-only.
 *
 *   node tools/ssr-audit.mjs <path-to-components> [--json]
 *
 * It is a heuristic text scan: it cannot tell whether `window` is used inside useEffect
 * (fine) or during render (breaks SSR), so "check" findings need a human look.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';

const RULES = [
    // --- registration
    { id: 'mapto-v1', level: 'migrate', re: /\bMapTo\s*(?:<[^>]*>)?\s*\([^)]*\)\s*\(\s*[\w.]+\s*,/,
      msg: 'MapTo(type)(Component, editConfig): v2 ignores editConfig and passes a single `model` prop; for v1-style components import MapTo from "aem-react-spa-next/v1-compat"' },
    { id: 'v1-api', level: 'migrate', re: /\b(withMappable|withModel|ModelProvider|withEditable|withComponentMappingContext|ComponentMappingContext|EditorContext)\b/,
      msg: 'editable-components v1 API: no v2 equivalent, rework with EditableComponent / props' },
    { id: 'v1-subclass', level: 'migrate', re: /\bextends\s+(Container|Page|ResponsiveGrid|AllowedComponentsContainer)\b/,
      msg: 'subclasses a v1 container class: rewrite with v2 Container / getChildComponents()' },
    { id: 'lazy-map', level: 'check', re: /\blazyMap\b|React\.lazy\s*\(|\blazy\s*\(/,
      msg: 'lazy component: works with SSR, but make sure it is not only resolved in the browser' },

    // --- browser-only APIs
    { id: 'browser-global', level: 'check', re: /\b(window|document|localStorage|sessionStorage|navigator|location)\s*\./,
      msg: 'browser global: fine inside useEffect / event handlers, breaks SSR at module scope or during render' },
    { id: 'typeof-window', level: 'check', re: /typeof\s+window\s*[!=]==?/,
      msg: 'typeof window branch: if it changes rendered output, server and client markup differ (hydration mismatch)' },
    { id: 'layout-effect', level: 'check', re: /\buseLayoutEffect\b/,
      msg: 'useLayoutEffect does not run on the server: fine for measuring, not for producing initial markup' },
    { id: 'dompurify', level: 'fix', re: /from\s+['"]dompurify['"]|require\(\s*['"]dompurify['"]\s*\)/,
      msg: 'DOMPurify v2 has no sanitize() in Node (render throws): use sanitize-html or isomorphic-dompurify' },
    { id: 'nondeterministic', level: 'check', re: /\b(Math\.random|Date\.now)\s*\(|new\s+Date\s*\(\s*\)/,
      msg: 'non-deterministic value: differs between server and client render if used for markup' },

    // --- routing / CRA conventions
    { id: 'react-router', level: 'fix', re: /from\s+['"]react-router(-dom)?['"]/,
      msg: 'react-router: replace Link/NavLink with next/link and useHistory/withRouter with next/navigation' },
    { id: 'cra-env', level: 'fix', re: /process\.env\.REACT_APP_/,
      msg: 'CRA env var: use NEXT_PUBLIC_* (browser) or a server-only variable' },
    { id: 'require-css', level: 'fix', re: /require\(\s*['"][^'"]+\.(css|scss|sass)['"]\s*\)/,
      msg: 'require() of a stylesheet: change to an ES import' },
    { id: 'polyfill', level: 'fix', re: /from\s+['"](react-app-polyfill|custom-event-polyfill)[^'"]*['"]|import\s+['"](react-app-polyfill|custom-event-polyfill)/,
      msg: 'CRA polyfill: not needed in Next.js' },
];

const LEVELS = { fix: 'must fix', migrate: 'migrate', check: 'check' };
const EXT = /\.(jsx?|tsx?|mjs|cjs)$/;
const SKIP_DIRS = new Set(['node_modules', '.next', 'dist', 'build', 'coverage', '.git', 'target']);

const args = process.argv.slice(2);
const root = args.find((a) => !a.startsWith('--'));
const asJson = args.includes('--json');
if (!root || !existsSync(root)) {
    console.error('Usage: node tools/ssr-audit.mjs <path-to-components> [--json]');
    process.exit(2);
}

function walk(dir, out = []) {
    for (const name of readdirSync(dir)) {
        if (SKIP_DIRS.has(name)) continue;
        const full = path.join(dir, name);
        const st = statSync(full);
        if (st.isDirectory()) walk(full, out);
        else if (EXT.test(name) && !/\.(test|spec|stories)\./.test(name)) out.push(full);
    }
    return out;
}

const files = statSync(root).isDirectory() ? walk(root) : [root];
const findings = [];
const resourceTypes = new Map();

for (const file of files) {
    const rel = path.relative(root, file) || path.basename(file);
    const source = readFileSync(file, 'utf8');
    const lines = source.split(/\r?\n/);
    // Files that already use the compat MapTo are migrated.
    const usesCompatMapTo = /from\s+['"]aem-react-spa-next\/v1-compat['"]/.test(source);
    lines.forEach((line, i) => {
        if (/^\s*(\/\/|\*)/.test(line)) return;
        for (const rule of RULES) {
            if (rule.id === 'mapto-v1' && usesCompatMapTo) continue;
            if (rule.re.test(line)) findings.push({ file: rel, line: i + 1, rule: rule.id, level: rule.level, msg: rule.msg, code: line.trim().slice(0, 120) });
        }
        for (const m of line.matchAll(/\bMapTo\s*(?:<[^>]*>)?\s*\(\s*(\[[^\]]*\]|['"][^'"]+['"])/g)) {
            for (const t of m[1].match(/['"][^'"]+['"]/g) || []) {
                const type = t.slice(1, -1);
                if (!resourceTypes.has(type)) resourceTypes.set(type, []);
                resourceTypes.get(type).push(`${rel}:${i + 1}`);
            }
        }
    });
}

// Version of editable-components the project was written against, if a package.json is nearby.
let editableVersion = null;
for (let dir = path.resolve(statSync(root).isDirectory() ? root : path.dirname(root)); ; dir = path.dirname(dir)) {
    const pj = path.join(dir, 'package.json');
    if (existsSync(pj)) {
        const p = JSON.parse(readFileSync(pj, 'utf8'));
        editableVersion = { ...p.dependencies, ...p.peerDependencies, ...p.devDependencies }['@adobe/aem-react-editable-components'] || null;
        break;
    }
    if (path.dirname(dir) === dir) break;
}

const duplicates = [...resourceTypes].filter(([, where]) => where.length > 1);

if (asJson) {
    console.log(JSON.stringify({ files: files.length, editableVersion, resourceTypes: Object.fromEntries(resourceTypes), duplicates: Object.fromEntries(duplicates), findings }, null, 2));
    process.exit(0);
}

console.log(`\nSSR audit of ${path.resolve(root)}`);
console.log(`${files.length} source files · ${resourceTypes.size} resource types mapped with MapTo()`);
console.log(`@adobe/aem-react-editable-components: ${editableVersion || 'not found in package.json'}`);
if (editableVersion && /^[~^]?1\./.test(editableVersion)) {
    console.log('  → v1 project: switch MapTo imports to "aem-react-spa-next/v1-compat" (see INTEGRATING_COMPONENTS.md)');
}

for (const level of Object.keys(LEVELS)) {
    const list = findings.filter((f) => f.level === level);
    console.log(`\n${LEVELS[level].toUpperCase()} (${list.length})`);
    const byRule = Map.groupBy ? Map.groupBy(list, (f) => f.rule) : list.reduce((m, f) => m.set(f.rule, [...(m.get(f.rule) || []), f]), new Map());
    for (const [, items] of byRule) {
        console.log(`  ${items[0].msg}`);
        for (const f of items.slice(0, 25)) console.log(`    ${f.file}:${f.line}  ${f.code}`);
        if (items.length > 25) console.log(`    … ${items.length - 25} more`);
    }
}

if (duplicates.length) {
    console.log(`\nDUPLICATE RESOURCE TYPES (${duplicates.length}): the last registration imported wins`);
    for (const [type, where] of duplicates) console.log(`  ${type}: ${where.join(', ')}`);
}

console.log(`\nResource types:\n  ${[...resourceTypes.keys()].sort().join('\n  ') || '(none found)'}\n`);
