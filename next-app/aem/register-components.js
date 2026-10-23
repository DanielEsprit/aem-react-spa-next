"use client";

// Every MapTo() registration the site needs. MapTo() writes into a module-level registry, so
// this file must stay in the client module graph (it is imported by ./AemPage.js): that way
// the registry is filled during the server render of the client components AND in the
// browser bundle. Importing these from a Server Component would only fill it on the server,
// and hydration would fail with "Component not mapped for resourcetype".
//
// Order matters only when two modules map the same resource type: the last import wins.

// Built-in components (text, image, navigation, container, page, experience fragment).
import "aem-react-spa-next/components";

// Project components. Add one import per component library / barrel file.
import "example-aem-components";
