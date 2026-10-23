import { notFound } from "next/navigation";
import { AemPage } from "aem-react-spa-next";
import { isInEditorFromSearchParams, toPagePath } from "aem-react-spa-next/server";
import { getPageModel, getPageModelUncached, isContentPath } from "@/lib/aem";

// Allow this route to block on request data (params, ?wcmmode, the page model) instead of
// streaming it behind <Suspense>. With Suspense, Cache Components sends an empty shell and
// streams the content into a hidden <div> that an inline script swaps in, so the page is
// blank until that script runs (or forever without JS). Blocking sends one complete HTML
// document with the content inline.
export const instant = false;

export async function generateMetadata({ params }) {
  const pagePath = toPagePath((await params).path);
  const pageModel = isContentPath(pagePath) ? await getPageModel(pagePath) : null;
  return { title: pageModel?.title || "AEM React SPA" };
}

// Server Component: fetches the model per request and hands it to the client component as
// a prop. Everything the client needs to reproduce the server markup (model, editor flag)
// travels in the RSC payload, which is what makes hydration line up.
export default async function Page({ params, searchParams }) {
  const pagePath = toPagePath((await params).path);
  if (!isContentPath(pagePath)) {
    notFound();
  }

  const isInEditor = isInEditorFromSearchParams(await searchParams);
  const pageModel = isInEditor
    ? await getPageModelUncached(pagePath)
    : await getPageModel(pagePath);
  if (!pageModel) {
    notFound();
  }

  return <AemPage pageModel={pageModel} pagePath={pagePath} isInEditor={isInEditor} />;
}
