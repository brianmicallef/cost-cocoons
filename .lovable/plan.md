## Goal

When you add a moodboard item with a URL (Instagram account/post, company website, etc.), automatically detect the **source** — handle for Instagram, brand domain otherwise — and display it as a prominent, clickable chip on the tile. Clicking a source chip filters the wall to show only items from that source, alongside the existing category and user filters.

No new "Source" entity, no separate panel. Sources are derived from item URLs, so they stay in sync automatically and require zero extra data entry.

## What the user will see

**On each tile (when a URL is set)**
- A small chip near the top-left (next to the category badge on hover, or in the bottom info overlay) showing:
  - For Instagram URLs: `@handle` with the Instagram glyph
  - For other sites: the brand/domain (e.g. `vitra.com`) with a favicon
- Clicking the chip → toggles a source filter on the wall (does not open the URL).
- A separate "open link" affordance stays in the expanded panel (already exists).

**Filter bar (new row, only shown when there are detected sources)**
- "Source" row, similar to the existing Category and "Added by" rows.
- Each detected source becomes a chip: `@studioshamshiri 4`, `vitra.com 2`, etc.
- Multi-select, combines with category + user filters.
- Sources with zero items in the currently visible set are dimmed.

**Add/Edit dialog**
- After pasting a URL and clicking "Fetch", show a small preview line: `Source: @handle` or `Source: vitra.com` so the user can see what was detected.
- No new field to fill in.

**Expanded item panel**
- The existing "Source" line (currently shows host like `instagram.com`) is upgraded to show `@handle` for Instagram, brand for others, and becomes a button that applies the source filter.

## Source detection rules

Pure function, derived on the fly from `item.url`:

- `instagram.com/<handle>` or `instagram.com/<handle>/...` → `{ kind: 'instagram', key: '@handle', label: '@handle', href: 'https://instagram.com/handle' }`
- `instagram.com/p/...` or `/reel/...` → no handle in URL; fall back to `{ kind: 'instagram', key: 'instagram', label: 'Instagram' }` (post-level credit isn't in the URL)
- `tiktok.com/@handle`, `youtube.com/@handle`, `pinterest.com/<user>` → same `@handle` treatment
- Anything else → `{ kind: 'site', key: 'domain.com', label: 'domain.com', href: origin }` (strip `www.`)
- No URL → no source chip, no contribution to filter bar.

Two items with the same `key` are considered the same source.

## Filtering behaviour

- New state: `activeSources: Set<string>` (set of source keys).
- An item passes the source filter if its detected source key is in the active set (or the set is empty).
- Combined with existing `activeBoardIds` and `activeUsers` filters using AND.
- Source filter persists while you navigate categories/users; "All" chip clears it.

## Logo / favicon

- Instagram: use the Lucide `Instagram` icon (already available).
- Other sites: use `https://www.google.com/s2/favicons?domain=<host>&sz=64` as the chip icon. Falls back to a generic Globe icon on error.
- No upload flow, no extra storage. (If you later want a custom logo per source, that becomes a separate feature — flagged below.)

## Export / import

- Nothing changes in the data model — sources are derived from `item.url`, which is already exported.
- No schema bump.

## Technical details

**New file: `src/lib/moodSources.ts`**
- `detectSource(url?: string): { kind: 'instagram' | 'site'; key: string; label: string; href?: string } | null`
- `groupBySource(items: MoodItem[])` → `Map<key, { source, count }>` for filter bar.

**`MoodboardPage.tsx`**
- Add `activeSources` state + `toggleSource` + reset in "All".
- Compute `sourceCounts` from the items visible under category+user filters.
- Render a third filter row (only if `sourceCounts.size > 0`) styled to match the existing rows.
- Add source key to the `allItems` filter chain.

**`MoodTile.tsx`**
- Add `onSourceClick(key: string)` prop.
- Replace the bare host string in the hover overlay and in the expanded panel's "Source" field with a `SourceChip` rendering icon + label, clickable to call `onSourceClick`.

**`AddMoodItemDialog.tsx`**
- After successful `handleFetch` (and whenever `url` changes), compute `detectSource(url)` and show a one-line readout under the URL input: `Detected source: @handle`.

**No backend changes, no migration, no edge function changes.** OG fetch already returns image/title; we don't need it for source detection.

## Out of scope (flag for later)

- Editable per-source metadata (custom logo, notes, votes on the source itself).
- A standalone "Sources" tab/page.
- Following a source to be notified of new posts.
- Manually overriding the detected source for an item.

If you later want any of these, the natural next step is to promote a source key into a first-class `Source` entity stored on the project, keyed by the same string so existing tiles keep working.