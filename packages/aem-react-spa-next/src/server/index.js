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
 * Server-only helpers. These replace `ModelManager.initialize()` on the server: the
 * ModelManager is a process-wide singleton, so using it during SSR would leak one
 * request's page model into another. Instead the page model is fetched per request
 * and handed to the client as a serialisable prop.
 */

const WCM_MODES_IN_EDITOR = ['edit', 'preview'];

/**
 * Converts the catch-all route segments into an AEM page path,
 * e.g. ['content', 'mysite', 'us', 'en', 'home.html'] -> /content/mysite/us/en/home
 *
 * @param {string[]|undefined} segments
 * @returns {string}
 */
export function toPagePath(segments) {
  const path = '/' + (segments || []).map(decodeURIComponent).join('/');
  return path.replace(/\.html?$/, '').replace(/\/+$/, '') || '/';
}

/**
 * Mirrors AuthoringUtils.isInEditor() but works from request data instead of
 * `window.location` / `<meta>` tags, so the server and the client agree on the value
 * and the editor markup (data-cq-data-path etc.) does not cause hydration mismatches.
 *
 * @param {Record<string, string|string[]|undefined>} searchParams
 * @returns {boolean}
 */
export function isInEditorFromSearchParams(searchParams) {
  const mode = searchParams && searchParams.wcmmode;
  return WCM_MODES_IN_EDITOR.includes(Array.isArray(mode) ? mode[0] : mode);
}

/**
 * Fetches the page model for a page path from AEM.
 *
 * @param {string} pagePath - e.g. /content/mysite/us/en/home
 * @param {{ host: string, authorization?: string, init?: RequestInit }} options
 * @returns {Promise<object|null>} the raw page model, or null if the page does not exist
 */
export async function fetchPageModel(pagePath, { host, authorization, init = {} }) {
  if (!host) {
    throw new Error('fetchPageModel: an AEM host is required');
  }

  const response = await fetch(`${host.replace(/\/$/, '')}${pagePath}.model.json`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(authorization ? { Authorization: authorization } : {}),
      ...init.headers,
    },
  });

  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Fetching page model ${pagePath} failed with status ${response.status}`);
  }

  return response.json();
}
