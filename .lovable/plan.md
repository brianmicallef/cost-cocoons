## Goal

Make the app comfortable to use on a phone. Focus area you picked: the **top header / navigation**. Filters, grid and dialogs stay as-is for now.

## What changes on mobile (< 640px)

### 1. Header becomes compact
- Hide the project name's giant gradient on phones; show a shorter single-line title.
- Drop the tagline on phones (it wraps awkwardly).
- Header keeps: logo tile, project name (truncated), theme toggle, user avatar/menu.
- Import / Export move out of the header into an **overflow "More" menu** (three-dot dropdown) on phones. On `sm+` they stay where they are today.
- `TopNav` (Moodboard / Cost Tracker links) is hidden on phones — replaced by the bottom bar.

### 2. New bottom tab bar (phones only)
- Fixed to the bottom of the viewport, full width, safe-area aware (`pb-[env(safe-area-inset-bottom)]`).
- Two tabs: **Moodboard** (image icon) and **Cost Tracker** (house icon), each a `NavLink` with active state (filled accent background, label below icon).
- Hidden on `sm+` (desktop/tablet keep the inline top nav).
- Main content gets `pb-20 sm:pb-0` so the last row isn't hidden behind the bar.

### 3. Guest view
- Bottom bar still shows on `/m/...` guest routes for navigation parity, but tabs that require auth are hidden — only Moodboard is shown to guests, and the "Sign in" button stays in the header.

## Files

- **`src/components/TopNav.tsx`** — add `className` prop; hide via `hidden sm:flex` from header usage.
- **`src/components/BottomNav.tsx`** *(new)* — fixed bottom bar, `sm:hidden`, two NavLinks with icon + label, active styling using existing accent tokens. Accepts `readOnly` to hide Cost Tracker for guests.
- **`src/components/HeaderActions.tsx`** *(new, small)* — renders Import / Export buttons inline on `sm+` and collapses them into a `DropdownMenu` (MoreHorizontal icon) on phones. Takes `onImport`, `onExport` props so both pages reuse it.
- **`src/components/moodboard/MoodboardPage.tsx`** — swap inline Import/Export buttons for `<HeaderActions>`, add `<BottomNav readOnly={readOnly} />` before the closing wrapper, add `pb-20 sm:pb-0` to `<main>`, hide tagline on mobile (`hidden sm:block`), tighten title size on mobile.
- **`src/components/ProjectTracker.tsx`** — same swap to `<HeaderActions>`, add `<BottomNav />`, `pb-20 sm:pb-0` on `<main>`, hide subtitle on phones.
- **`src/pages/MoodboardGuest.tsx`** — verify it renders `<MoodboardPage readOnly />` only (no change needed unless it duplicates the header).

## Out of scope (flagged for follow-up)

- Moodboard filter chips horizontal scroll on phones.
- Cost Tracker table density / row tap targets.
- Dialogs becoming full-screen sheets on phones.

Say "looks good" and I'll build it, or tell me what to change.
