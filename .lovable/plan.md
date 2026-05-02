# Add Moodboard page

A second page for collecting product inspiration: links, images, notes, organised into user-created boards. Includes URL auto-fetching, image file uploads, and an option to push an item into the Cost Tracker.

## Navigation & routing

- Add a top-level nav bar (shown on both pages) with two tabs: **Cost Tracker** (`/`) and **Moodboard** (`/moodboard`).
- Register `/moodboard` in `src/App.tsx` alongside the existing `/` route.
- Move the password gate to wrap both routes.

## Data model (`src/types/project.ts`)

Add to the `Project` interface:

```
moodboard?: {
  boards: MoodBoard[];
}
```

```
MoodBoard { id, name, color, items: MoodItem[] }
MoodItem {
  id, title, url?, imageUrl?, notes?, price?,
  tags?: string[],
  createdAt: string,
  linkedCostItemId?: string  // set when promoted
}
```

Same Netlify Blobs project endpoint is used (`/.netlify/functions/project`) — moodboard is just another field on `Project`, no schema work needed.

## Storage for image uploads

User wants real file uploads, so we need a storage backend. Two paths:

1. **Recommended — enable Lovable Cloud** (Supabase). Create a public `moodboard` bucket and a storage RLS policy. Upload from the browser, save the public URL on the `MoodItem`. Project still uses Netlify Blobs for the JSON; Cloud is used only for image files.
2. Alternative — store images as base64 inside the existing JSON blob. Works with zero new infra but bloats the project file fast (Netlify Blobs has size limits and we save on every change). Not recommended beyond a handful of small images.

Plan assumes option 1. If you'd rather skip enabling Cloud for now, say so and we'll start with URL-only and add uploads later.

## URL auto-fetch (Open Graph)

New Netlify function `netlify/functions/og.ts`:

- `GET /.netlify/functions/og?url=...`
- Fetches the URL server-side, parses `<meta property="og:title">`, `og:image`, `og:description`, falls back to `<title>` and first `<img>`.
- Returns `{ title, image, description, siteName }`.
- Server-side avoids CORS and keeps the client simple. No external API/key needed.

The Add Item dialog calls this endpoint when the user pastes a URL, then pre-fills the form. All fields remain editable (manual override).

## Hook (`src/hooks/useMoodboard.ts`)

Mirrors the structure of `useProject`:

- Reads/writes the same `Project` blob, but exposes only moodboard slice + mutators.
- `addBoard`, `renameBoard`, `deleteBoard`, `reorderBoards`
- `addItem(boardId, partial)`, `updateItem`, `deleteItem`, `moveItem(fromBoard, toBoard, itemId, toIndex)`, `reorderItems`
- `promoteToCostItem(boardId, itemId, targetCategoryId)` — creates a `LineItem` in the chosen Cost Tracker category using title/price/url, sets `linkedCostItemId`.

To keep one source of truth we'll refactor `useProject` so both hooks read/write the same in-memory project (lift state into a small context provider, or merge into a single `useProject` that also returns moodboard helpers — leaning toward the latter for simplicity).

## UI components

New files under `src/components/moodboard/`:

- `MoodboardPage.tsx` — page shell, board list, "Add board" button, nav bar.
- `MoodBoardCard.tsx` — board header (name, color dot, count, collapse) + grid of items + drag-and-drop (reuse `@dnd-kit` patterns from `CategoryCard`).
- `MoodItemCard.tsx` — image thumbnail (or placeholder), title, price, source domain, hover actions: open link, edit, delete, **promote to cost item**.
- `AddMoodItemDialog.tsx` — paste-URL field with "Fetch" button (calls `/og`), fields for title / image URL / notes / price / tags / file upload (Cloud).
- `PromoteToCostDialog.tsx` — pick existing Cost Tracker category (or create new), confirm.
- `TopNav.tsx` — shared nav with the two tabs and the existing theme toggle / version label.

Reuse existing shadcn components (`Card`, `Dialog`, `Input`, `Button`, `Badge`, `HoverCard`).

Layout: responsive CSS grid, ~3–4 cards per row at current viewport width.

## Cost Tracker changes

Minimal:

- Extract the header (title, version, theme toggle, import/export buttons) into a layout that sits under `TopNav`.
- Export filename and "Cost Tracker v0.2" label remain unchanged. Bump to **v0.3** since this is a meaningful feature addition.
- No data-model change needed for cost items; promote-to-cost just uses existing `addLineItem`.

## Files

New:
- `src/pages/Moodboard.tsx`
- `src/components/TopNav.tsx`
- `src/components/moodboard/MoodboardPage.tsx`
- `src/components/moodboard/MoodBoardCard.tsx`
- `src/components/moodboard/MoodItemCard.tsx`
- `src/components/moodboard/AddMoodItemDialog.tsx`
- `src/components/moodboard/PromoteToCostDialog.tsx`
- `src/hooks/useMoodboard.ts` (or merged into `useProject`)
- `netlify/functions/og.ts`

Edited:
- `src/App.tsx` — add `/moodboard` route
- `src/pages/Index.tsx` — wrap with new layout
- `src/types/project.ts` — add `moodboard` field + `MoodBoard` / `MoodItem` types
- `src/hooks/useProject.ts` — add moodboard mutators + migration default `{ boards: [] }`
- `src/components/ProjectTracker.tsx` — slot under shared nav, bump version to v0.3

## Open items to confirm before building

1. OK to enable **Lovable Cloud** for image-file uploads? (Otherwise we ship URL-only first.)
2. Bump the visible version to **v0.3**?
