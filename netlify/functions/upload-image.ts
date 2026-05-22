import { getStore } from "@netlify/blobs";
import type { Context } from "@netlify/functions";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/bmp",
  "image/tiff",
  "image/avif",
  "image/heic",
  "image/heif",
]);

const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/bmp": "bmp",
  "image/tiff": "tiff",
  "image/avif": "avif",
  "image/heic": "heic",
  "image/heif": "heif",
};

export default async (request: Request, _context: Context) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const contentType = request.headers.get("content-type") || "";

  if (!ALLOWED_TYPES.has(contentType)) {
    return new Response(
      JSON.stringify({ error: "Unsupported image format" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const body = await request.arrayBuffer();
  if (body.byteLength === 0) {
    return new Response(
      JSON.stringify({ error: "Empty file" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (body.byteLength > 10 * 1024 * 1024) {
    return new Response(
      JSON.stringify({ error: "File too large (max 10 MB)" }),
      { status: 413, headers: { "Content-Type": "application/json" } }
    );
  }

  const ext = EXT_MAP[contentType] || "bin";
  const key = `${crypto.randomUUID()}.${ext}`;
  const store = getStore("moodboard-images");

  await store.set(key, body, {
    metadata: { contentType },
  });

  const imageUrl = `/.netlify/functions/serve-image?key=${encodeURIComponent(key)}`;

  return new Response(JSON.stringify({ url: imageUrl }), {
    headers: { "Content-Type": "application/json" },
  });
};
