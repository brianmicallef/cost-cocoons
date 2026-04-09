import { getStore } from "@netlify/blobs";
import type { Context } from "@netlify/functions";

const STORE_NAME = "project-data";
const PROJECT_KEY = "current-project";

export default async (request: Request, _context: Context) => {
  const store = getStore({ name: STORE_NAME, consistency: "strong" });

  if (request.method === "GET") {
    const data = await store.get(PROJECT_KEY, { type: "json" });
    if (!data) {
      return new Response(JSON.stringify(null), {
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (request.method === "PUT") {
    const body = await request.json();
    await store.setJSON(PROJECT_KEY, body);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response("Method not allowed", { status: 405 });
};
