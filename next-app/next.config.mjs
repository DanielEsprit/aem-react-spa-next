/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,

  // Pin the workspace root to this app so a lockfile in a parent folder is never picked instead.
  turbopack: { root: import.meta.dirname },

  // Component libraries that ship untranspiled JSX (and "use client" directives) must be
  // listed here. Add your own component packages alongside these.
  transpilePackages: ["aem-react-spa-next", "example-aem-components"],

  async redirects() {
    // Send "/" to the app's root page.
    return process.env.AEM_ROOT
      ? [{ source: "/", destination: process.env.AEM_ROOT, permanent: false }]
      : [];
  },

  async rewrites() {
    // DAM assets referenced by the page model (e.g. /content/dam/...) are served by AEM.
    // Files in /public win over this rewrite, which the mock content relies on.
    return process.env.AEM_HOST?.startsWith("http")
      ? [{ source: "/content/dam/:path*", destination: `${process.env.AEM_HOST}/content/dam/:path*` }]
      : [];
  },
};

export default nextConfig;
