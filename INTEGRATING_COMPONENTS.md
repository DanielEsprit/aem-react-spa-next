# Integrating an existing MapTo() component library

How to render an existing AEM SPA component codebase (components registered with `MapTo()`) in the Next.js app, with server-side rendering and hydration.

[`packages/example-aem-components`](packages/example-aem-components) is a working example. It contains one component in each style, and both render on the mock home page:

| Component | Written for | Change needed |
|-----------|-------------|---------------|
| `Teaser` | editable-components **v1** (`MapTo(type)(Teaser, EditConfig)`, plain props) | The `MapTo` import only |
| `Quote` | editable-components **v2** (wraps itself in `EditableComponent`) | None |

## 1. Audit the codebase

```bash
node tools/ssr-audit.mjs <path-to-your-components>
```

The audit is read-only. It reports:
- which `@adobe/aem-react-editable-components` version the project uses
- every resource type it maps, and any duplicates
- findings in three groups:
  - **must fix:** breaks server rendering
  - **migrate:** v1 APIs
  - **check:** needs a human look, e.g. `window` usage, which is fine inside `useEffect` but breaks during render

Add `--json` for machine-readable output.

## 2. Bring the code into the repo

Pick whichever matches how the code lives today:

- **A separate package (recommended):** copy or move it to `packages/<name>/` and add it to `next-app/package.json`:
  ```json
  "my-aem-components": "file:../packages/my-aem-components"
  ```
  Then add the folder name to the `lib:sync` script's list.
- **An npm package your team already publishes:** `npm install` it in `next-app`.
- **Loose files:** put them under `next-app/components/` and skip steps 3 and 4.

Then:

3. **List the package in `transpilePackages`** in [`next-app/next.config.mjs`](next-app/next.config.mjs) if it ships JSX or untranspiled source.
4. **Declare the Adobe libraries and React as `peerDependencies`**, not `dependencies`, in the package's `package.json`. See [the example](packages/example-aem-components/package.json). `MapTo()` writes into the module-level registry of `@adobe/aem-spa-component-mapping`. Two copies of that library mean two registries, and your components fail with "Component not mapped for resourcetype". Check that there is exactly one copy:
   ```bash
   cd next-app && npm ls @adobe/aem-spa-component-mapping
   ```

## 5. Register the components

Import the package's barrel file in [`next-app/aem/register-components.js`](next-app/aem/register-components.js):

```js
"use client";
import "aem-react-spa-next/components"; // built-ins (text, image, navigation, container, …)
import "my-aem-components";             // your MapTo() registrations
```

This file must stay a `"use client"` module, imported by `next-app/aem/AemPage.js`. That's what puts the registrations in the server render **and** the browser bundle. If two modules map the same resource type, the last import wins. You can drop the built-ins line if your library maps all the resource types it needs itself.

## 6. Make the components SSR-safe

Work through the audit findings:

| Finding | What to do |
|---------|------------|
| v1 `MapTo(type)(Component, editConfig)` | Change only the import: `import { MapTo } from "aem-react-spa-next/v1-compat"`. It gives the component plain props on the server and keeps `editConfig` (`emptyLabel`, `isEmpty`) driving the editor placeholder. |
| v1 `withMappable`, `withModel`, `ModelProvider`, `EditorContext`, subclasses of `Container` / `ResponsiveGrid` | No drop-in equivalent. Rewrite against v2: `EditableComponent`, plus `Container` / `getChildComponents()` for custom containers. |
| `react-router-dom` | Use `next/link` for links, and `useRouter` / `usePathname` from `next/navigation` for history and location. |
| DOMPurify | Use `sanitize-html` (as the built-in `Text` does) or `isomorphic-dompurify`. DOMPurify v2 throws on the server. |
| `window` / `document` / `localStorage` during render | Move into `useEffect` or event handlers. Never branch rendered output on `typeof window`: the server and client markup would differ. |
| `Math.random()`, `Date.now()`, `new Date()` in markup | Compute on the server and pass as a prop, or use React's `useId()` for ids. |
| `require('./x.css')` | Use `import './x.css'`. Global CSS can be imported from any client component in the App Router. SCSS works because `sass` is installed. |
| `process.env.REACT_APP_*` | Use `NEXT_PUBLIC_*` for values the browser needs, and plain server-only variables for secrets. |

## 7. Verify

1. Add a fixture under `next-app/mock-aem/` that uses your resource types. Real `.model.json` exports from AEM work best.
2. Run `npm run build && npm start` in `next-app`, then check:
   - **Server HTML:** `curl` the page and confirm your components' markup is in it.
   - **Hydration:** the browser console shows no hydration errors.
   - **Editor mode:** with `?wcmmode=edit`, every component has a `data-cq-data-path` wrapper, and empty components show their placeholder.
