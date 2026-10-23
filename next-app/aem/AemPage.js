"use client";

import { AemPage } from "aem-react-spa-next";
import "./register-components";

// The app's client boundary for AEM pages: loads all component registrations, then renders the
// library's AemPage. Server Components (app/[...path]/page.js) render this, never the library's
// AemPage directly.
export default function AppAemPage(props) {
  return <AemPage {...props} />;
}
