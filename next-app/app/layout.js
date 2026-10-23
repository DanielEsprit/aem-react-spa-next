import "aem-react-spa-next/styles/index.scss";

export const metadata = {
  title: "AEM React SPA",
  description: "AEM React SPA",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Next.js owns routing: stop the ModelManager from patching history.pushState and
            fetching the model again on every navigation (the server already sent it). */}
        <meta property="cq:pagemodel_router" content="disabled" />
      </head>
      <body>{children}</body>
    </html>
  );
}
