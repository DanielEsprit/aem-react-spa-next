# Running aem-react-spa on Next.js (SSR + hydration)

This branch adds a proof of concept that runs the aem-react-spa components on **Next.js 16 (App Router, React 19)**. Pages are server-rendered and then hydrated on the client. The original Create-React-App project (`src/`, `scripts/`, `public/`) is unchanged.

```
packages/aem-react-spa-next/   SSR-safe port of src/ (the "library")
next-app/                      create-next-app boilerplate that consumes it
```

## Quick start

```bash
cd next-app
npm install
npm run dev        # http://localhost:3000 → redirects to /content/aem-react-spa/us/en/home.html
```

By default the app reads page models from a bundled **mock AEM** (`next-app/mock-aem/**.model.json`, served at `/mock-aem/...`). The mock is reached over HTTP at `http://localhost:3000/mock-aem`, so if you run on a different port, change `AEM_HOST` to match. To use a real instance, create `next-app/.env.local`:

```dotenv
AEM_HOST=http://localhost:4502
AEM_AUTHORIZATION_HEADER=Basic YWRtaW46YWRtaW4=
AEM_ROOT=/content/<appId>/us/en/home.html
```

`next-app` installs the package as a copy (`install-links=true` in `.npmrc`). `predev` and `prebuild` run `npm run lib:sync`, which re-copies it, so edits under `packages/` are picked up on the next `dev`/`build`.

## Analysis: what stopped the CRA app from server-rendering

| # | Where | Problem under SSR / hydration | Fix in this branch |
|---|-------|-------------------------------|--------------------|
| 1 | `src/index.js` | Client-only boot: `DOMContentLoaded`, `createRoot`, `createBrowserHistory`, IE polyfills. Nothing renders until JS runs. | Replaced by the Next.js catch-all route `app/[...path]/page.js` (Server Component) and the `AemPage` client component. |
| 2 | `ModelManager.initialize()` | A process-wide **singleton**. On a server it would share one request's page model with every other request. It also reads `window.location` / `<meta>` to find the root model. | The server fetches the model **per request** (`fetchPageModel`, cached with `"use cache"` + `cacheLife`) and passes it as a prop. The ModelManager is used **only in the browser**, where `seedModelManager()` seeds it with that same model so it never re-fetches. |
| 3 | `EditableComponent` (Adobe lib) | Calls `ModelManager.addListener()` in an effect. That **throws if the ModelManager was never initialised**, and child effects run before parent effects. | `seedModelManager()` runs during render (browser only, idempotent), so it finishes before any child effect. |
| 4 | `isInEditor` default (Adobe lib) | Defaults to `AuthoringUtils.isInEditor()`, which reads `document`/`location`. It is always `false` on the server but can be `true` on the client, which causes a **hydration mismatch** on editor attributes (`data-cq-data-path`, placeholders). | Resolved on the server from `?wcmmode=edit\|preview` (`isInEditorFromSearchParams`) and passed down explicitly. Verified: editor markup hydrates without warnings. |
| 5 | `Text.js` uses DOMPurify v2 | DOMPurify needs a DOM. In Node, `DOMPurify.sanitize` is **undefined**, so SSR throws `DOMPurify.sanitize is not a function` (verified). | Uses `sanitize-html` (already a dependency, with the existing whitelist), which gives identical output on server and client. The whitelist no longer mutates `sanitizeHtml.defaults` globally. |
| 6 | React Router v5 (`Router`, `Route`, `withRoute`, `Link`) | Browser-history routing. CRA loaded the **whole site tree** and let `withRoute` show the active child page. | Next.js file routing: one page model per request; `withRoute` removed; `Navigation` uses `next/link` (soft navigation via one RSC request). |
| 7 | ModelManager's own router | It patches `history.pushState` and **fetches the model again on every navigation**, even though Next.js already delivered it in the RSC payload (observed in testing). | `<meta property="cq:pagemodel_router" content="disabled">` in the root layout. Verified: zero model fetches on navigation. |
| 8 | `LocalDevModelClient` + `.env` | `REACT_APP_AEM_AUTHORIZATION_HEADER` is **inlined into the browser bundle**. The CRA dev proxy only exists in development. | Credentials are server-only (`AEM_AUTHORIZATION_HEADER`). The browser's ModelManager talks to a same-origin route handler `/api/aem/[...path]` (`ProxyModelClient`), which adds them. |
| 9 | `require('./X.css')`, SCSS, `process.env.REACT_APP_*` | CRA-specific conventions. | ES `import` of CSS (App Router allows global CSS in any component), `sass` dev dependency, server env vars. |
| 10 | No `"use client"` in `@adobe/aem-react-editable-components` | The Adobe components use hooks, so they cannot be rendered from a Server Component directly. | `AemPage` is the `"use client"` boundary. All `MapTo` registrations are imported from inside it, so the `ComponentMapping` exists during SSR **and** in the browser. |

What works without changes: `@adobe/aem-react-editable-components@2` and `@adobe/aem-spa-page-model-manager@1.5` both import cleanly in Node (they guard with `isBrowser()`), and React 19 works with them.

## How rendering and hydration fit together

```
request /content/aem-react-spa/us/en/home.html?wcmmode=edit
  └─ app/[...path]/page.js  (Server Component, `instant = false`: blocks, no <Suspense>)
       ├─ toPagePath()                 → /content/aem-react-spa/us/en/home
       ├─ isInEditorFromSearchParams() → true
       ├─ getPageModel()               → fetch AEM_HOST + .model.json ("use cache" unless authoring)
       └─ <AemPage pageModel pagePath isInEditor />   ← serialised into the RSC payload
            "use client"
            ├─ seedModelManager()  (browser only; ModelManager.initializeAsync({ model }))
            └─ <EditableComponent model> <Page …/> </EditableComponent>
                  └─ Container → ComponentMapping → Text / Image / Navigation / ResponsiveGrid …
```

The client render receives exactly the same `pageModel` and `isInEditor` as the server render, so React hydrates the existing markup rather than re-rendering it.

## What was verified (production build and `next dev`)

- `next build` passes.
- The page arrives as one complete HTML document. The route sets `export const instant = false` and has no `<Suspense>`, so content is inline and visible: no hidden streaming `<div>` and no inline swap script. This was verified for Chrome, Googlebot and Twitterbot user agents, and by rendering the HTML with every `<script>` removed.
- The raw HTML (curl, no JS) contains the full page: navigation, rich text, image and `<title>`. The XSS probe in the rich-text fixture is stripped from the DOM.
- The page hydrates, with no hydration warnings in dev or prod, and the browser makes no model request after load.
- Clicking a `next/link` nav item is a same-document navigation: one RSC request, zero model fetches, and the title and active nav item update.
- With `?wcmmode=edit`, the editor attributes and drop zones are server-rendered and hydrate cleanly.
- `/` redirects to `AEM_ROOT`. Paths outside `/content/` return 404. The mock route rejects path traversal.
- ESLint passes for the app. In the package, one pre-existing false positive remains (`jsx-a11y/alt-text` on `<Image>`).

## Not verified / open items

- **The AEM SPA Editor itself.** There was no AEM instance available. In-context editing of a remote SPA also needs `apiHost` set to the AEM author (`AemPage` accepts `apiHost`) so the ModelManager can load the editor clientlibs, plus CORS and CSP/frame-ancestors on the Next.js side.
- **404 status for unknown pages.** These still return HTTP 200 with the not-found UI and `noindex`, because Next.js commits the status from its prerendered layout shell (`x-nextjs-postponed: 1`) before the page runs. Options: `generateStaticParams` with `dynamicParams = false` for a known set of pages, or a `proxy` check against AEM.
- **Child pages (`:children`).** These are dropped, because every page is its own Next.js route. A site that relies on the root model containing the whole tree (e.g. preloading) would need `getPageModel` on the root path plus a lookup.
- **Experience Fragments / lazy components** (`ComponentMapping.lazyMap`) are not exercised by the fixtures.
- **Upstream changes worth proposing to Adobe:** add `"use client"` to `aem-react-editable-components`, make `addListener` safe before `initialize`, and allow `isInEditor` to be provided through context instead of read from the DOM.
- **Long term**, this could be built and published as a real npm package (compiled output with `"use client"` banners) instead of the `transpilePackages` + copy setup.
