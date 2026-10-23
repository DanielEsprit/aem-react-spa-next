import { toPagePath } from "aem-react-spa-next/server";
import { getPageModelUncached, isContentPath } from "@/lib/aem";

// Same-origin proxy used by the browser-side ModelManager (ProxyModelClient) for model
// updates. Replaces the CRA dev proxy and keeps the AEM credentials on the server.
export async function GET(_request, { params }) {
  const pagePath = toPagePath((await params).path).replace(/\.model\.json$/, "");
  if (!isContentPath(pagePath)) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const pageModel = await getPageModelUncached(pagePath);
  return pageModel
    ? Response.json(pageModel)
    : Response.json({ error: "Not found" }, { status: 404 });
}
