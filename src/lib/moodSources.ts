import type { MoodItem } from "@/types/project";

export type SourceKind = "instagram" | "tiktok" | "youtube" | "pinterest" | "site";

export interface DetectedSource {
  kind: SourceKind;
  /** Stable identifier used for filtering & grouping */
  key: string;
  /** Human-readable label, e.g. "@studioshamshiri" or "vitra.com" */
  label: string;
  /** URL to open when the user clicks "open" on the source */
  href?: string;
  /** Hostname of the page (for favicon fallback) */
  host?: string;
}

const HANDLE_HOSTS: Record<string, SourceKind> = {
  "instagram.com": "instagram",
  "www.instagram.com": "instagram",
  "tiktok.com": "tiktok",
  "www.tiktok.com": "tiktok",
  "youtube.com": "youtube",
  "www.youtube.com": "youtube",
  "pinterest.com": "pinterest",
  "www.pinterest.com": "pinterest",
  "uk.pinterest.com": "pinterest",
};

const SKIP_SEGMENTS = new Set([
  "p", "reel", "reels", "tv", "explore", "stories", "tag", "tags",
  "watch", "shorts", "channel", "c", "user", "playlist",
  "pin", "search", "ideas",
]);

export function detectSource(url?: string): DetectedSource | null {
  if (!url) return null;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const host = u.hostname.toLowerCase();
  const kind = HANDLE_HOSTS[host];
  const cleanHost = host.replace(/^www\./, "");

  if (kind) {
    const segments = u.pathname.split("/").filter(Boolean);
    let first = segments[0];
    if (first && first.startsWith("@")) first = first.slice(1);
    if (first && !SKIP_SEGMENTS.has(first.toLowerCase())) {
      const handle = first;
      let href: string;
      switch (kind) {
        case "instagram":
          href = `https://instagram.com/${handle}`;
          break;
        case "tiktok":
          href = `https://tiktok.com/@${handle}`;
          break;
        case "youtube":
          href = `https://youtube.com/@${handle}`;
          break;
        case "pinterest":
          href = `https://pinterest.com/${handle}`;
          break;
        default:
          href = u.origin;
      }
      return {
        kind,
        key: `${kind}:@${handle.toLowerCase()}`,
        label: `@${handle}`,
        href,
        host: cleanHost,
      };
    }
    // Platform but no handle in URL (e.g. instagram.com/p/xxx)
    return {
      kind,
      key: `${kind}:_platform`,
      label: cleanHost.split(".")[0].replace(/^\w/, (c) => c.toUpperCase()),
      href: `${u.origin}`,
      host: cleanHost,
    };
  }

  return {
    kind: "site",
    key: `site:${cleanHost}`,
    label: cleanHost,
    href: u.origin,
    host: cleanHost,
  };
}

export function faviconFor(host?: string): string | null {
  if (!host) return null;
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`;
}

export interface SourceGroup {
  source: DetectedSource;
  count: number;
}

export function groupBySource(items: MoodItem[]): Map<string, SourceGroup> {
  const map = new Map<string, SourceGroup>();
  for (const item of items) {
    const src = detectSource(item.url);
    if (!src) continue;
    const existing = map.get(src.key);
    if (existing) existing.count += 1;
    else map.set(src.key, { source: src, count: 1 });
  }
  return map;
}
