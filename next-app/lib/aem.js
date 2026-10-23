import { cacheLife } from "next/cache";
import { fetchPageModel } from "aem-react-spa-next/server";

const options = () => ({
  host: process.env.AEM_HOST,
  authorization: process.env.AEM_AUTHORIZATION_HEADER,
});

/** Only AEM content pages may be requested through the catch-all route / proxy. */
export function isContentPath(pagePath) {
  return /^\/content\/[^.]+$/.test(pagePath) && !pagePath.includes("..");
}

/** Published content: cached, so repeat visits and client navigations don't hit AEM. */
export async function getPageModel(pagePath) {
  "use cache";
  cacheLife("minutes");
  return fetchPageModel(pagePath, options());
}

/** Authoring (?wcmmode=edit|preview): always fresh. */
export async function getPageModelUncached(pagePath) {
  return fetchPageModel(pagePath, { ...options(), init: { cache: "no-store" } });
}
