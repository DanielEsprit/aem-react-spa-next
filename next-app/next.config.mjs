/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,

  // The CRA app's lockfile one level up would otherwise be picked as the workspace root.
  turbopack: { root: import.meta.dirname },

  // aem-react-spa-next ships untranspiled JSX + "use client" directives.
  transpilePackages: ["aem-react-spa-next"],

  async redirects() {
    // Same as the CRA dev index.html: send "/" to the app's root page.
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
