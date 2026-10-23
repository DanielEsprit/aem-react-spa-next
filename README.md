# AEM React SPA on Next.js

Renders AEM SPA pages with Next.js (App Router): the page model is fetched on the server, rendered to HTML, and hydrated in the browser.

This is a derivative of Adobe's [aem-react-spa](https://github.com/adobe/aem-react-spa) template. The original Create React App project has been removed; its components were ported to `packages/aem-react-spa-next`. See [NOTICE](NOTICE) and [LICENSE.txt](LICENSE.txt).

```
packages/aem-react-spa-next/   SSR-safe AEM components (the library)
next-app/                      Next.js app that renders AEM pages with it
```

## Getting started

```bash
cd next-app
npm install
npm run dev
```

Open http://localhost:3000. It redirects to the app's root page. By default, page models come from a bundled mock AEM. To use a real instance, set `AEM_HOST`, `AEM_AUTHORIZATION_HEADER` and `AEM_ROOT` in `next-app/.env.local`.

See [next-app/README.md](next-app/README.md) for the app's files, and [NEXTJS_MIGRATION.md](NEXTJS_MIGRATION.md) for the analysis, design and open items.

## License

Apache License, Version 2.0. See [LICENSE.txt](LICENSE.txt) and [NOTICE](NOTICE).
