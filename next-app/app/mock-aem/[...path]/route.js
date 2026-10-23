import { readFile } from "node:fs/promises";
import path from "node:path";

const MOCK_ROOT = path.join(process.cwd(), "mock-aem");

// Stand-in for an AEM publish instance so the app runs without AEM: serves
// mock-aem/<page path>.model.json fixtures at the same URLs AEM would.
export async function GET(_request, { params }) {
  const file = path.join(MOCK_ROOT, ...(await params).path);
  if (!file.startsWith(MOCK_ROOT + path.sep) || !file.endsWith(".model.json")) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  try {
    return Response.json(JSON.parse(await readFile(file, "utf-8")));
  } catch {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
}
