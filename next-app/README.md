# next-app

Boilerplate Next.js 16 app (create-next-app, App Router, JavaScript) that renders AEM pages with server-side rendering and hydration, using [`../packages/aem-react-spa-next`](../packages/aem-react-spa-next).

```bash
npm install
npm run dev     # http://localhost:3000
npm run build && npm start
```

| File | Purpose |
|------|---------|
| `app/[...path]/page.js` | Catch-all route. Fetches the page model on the server and renders `<AemPage>` |
| `app/layout.js` | Global styles and disables the ModelManager's own router |
| `lib/aem.js` | Model fetching (`"use cache"` for published content, uncached for authoring) |
| `app/api/aem/[...path]/route.js` | Same-origin proxy for the browser-side ModelManager (keeps AEM credentials on the server) |
| `app/mock-aem/[...path]/route.js` + `mock-aem/` | Mock AEM serving `.model.json` fixtures |
| `.env` | `AEM_HOST`, `AEM_AUTHORIZATION_HEADER`, `AEM_ROOT`. Override in `.env.local` |

See [`../NEXTJS_MIGRATION.md`](../NEXTJS_MIGRATION.md) for the analysis and design.
