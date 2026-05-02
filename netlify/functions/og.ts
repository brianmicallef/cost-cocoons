import type { Context } from "@netlify/functions";

// Lightweight Open Graph / metadata fetcher.
// GET /.netlify/functions/og?url=<encoded url>
// Returns: { title, image, description, siteName, url }

const pickMeta = (html: string, patterns: RegExp[]): string | undefined => {
  for (const re of patterns) {
    const m = html.match(re);
    if (m && m[1]) return decodeHtmlEntities(m[1].trim());
  }
  return undefined;
};

const decodeHtmlEntities = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'");

const absolutize = (raw: string | undefined, base: string): string | undefined => {
  if (!raw) return undefined;
  try {
    return new URL(raw, base).toString();
  } catch {
    return raw;
  }
};

export default async (request: Request, _context: Context) => {
  const u = new URL(request.url);
  const target = u.searchParams.get("url");
  if (!target) {
    return new Response(JSON.stringify({ error: "Missing url" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid url" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!/^https?:$/.test(parsed.protocol)) {
    return new Response(JSON.stringify({ error: "Only http(s) supported" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const res = await fetch(parsed.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; CostCocoonBot/1.0; +https://cost-cocoons.lovable.app)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });

    const ct = res.headers.get("content-type") || "";
    if (!res.ok || !ct.includes("text/html")) {
      return new Response(
        JSON.stringify({ url: parsed.toString(), title: parsed.hostname }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Limit body to ~512KB to avoid huge pages
    const reader = res.body?.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    const MAX = 512 * 1024;
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          total += value.length;
          if (total >= MAX) {
            try {
              await reader.cancel();
            } catch {}
            break;
          }
        }
      }
    }
    const html = new TextDecoder("utf-8").decode(
      new Uint8Array(chunks.flatMap((c) => Array.from(c)))
    );

    const title =
      pickMeta(html, [
        /<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i,
        /<meta\s+name=["']twitter:title["']\s+content=["']([^"']+)["']/i,
        /<title>([^<]+)<\/title>/i,
      ]) || parsed.hostname;

    const image = absolutize(
      pickMeta(html, [
        /<meta\s+property=["']og:image:secure_url["']\s+content=["']([^"']+)["']/i,
        /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i,
        /<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i,
        /<link\s+rel=["']image_src["']\s+href=["']([^"']+)["']/i,
      ]),
      parsed.toString()
    );

    const description = pickMeta(html, [
      /<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i,
      /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i,
    ]);

    const siteName = pickMeta(html, [
      /<meta\s+property=["']og:site_name["']\s+content=["']([^"']+)["']/i,
    ]);

    return new Response(
      JSON.stringify({
        url: parsed.toString(),
        title,
        image,
        description,
        siteName,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        url: parsed.toString(),
        title: parsed.hostname,
        error: err instanceof Error ? err.message : "fetch failed",
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  }
};
