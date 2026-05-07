## Goal
Make the moodboard header feel inspiring and modern instead of a flat utility bar — without redesigning the whole app.

## Changes (scoped to `src/components/moodboard/MoodboardPage.tsx` header only)

1. **Gradient backdrop**
   - Replace flat `bg-card` with a soft warm gradient using existing tokens: `bg-gradient-to-r from-accent/10 via-background to-accent/5` plus a subtle `backdrop-blur` while sticky.
   - Swap the hard `border-b` for a hairline `border-b border-border/40` so it feels lighter.

2. **Hero-style title**
   - Bump `h1` from `text-xl` to `text-2xl sm:text-3xl`, `font-bold tracking-tight`.
   - Apply a gradient text fill: `bg-gradient-to-r from-foreground to-accent bg-clip-text text-transparent`.
   - Replace the static "Moodboard" subtitle with a rotating inspirational tagline (e.g. "Curate your dream space", "Every great room starts with an idea", "Collect. Compose. Create."). Picked once on mount from a small array — no extra deps.

3. **Logo tile glow**
   - Keep the `ImageIcon` tile but upgrade to `bg-gradient-to-br from-accent to-accent/70`, add `shadow-lg shadow-accent/20`, and a soft `ring-1 ring-accent/30`. Slightly rounder (`rounded-2xl`).

4. **Sparkle accent**
   - Add a small `Sparkles` lucide icon next to the title (accent color, `h-4 w-4`) for a touch of delight.

5. **Action buttons polish**
   - Group Import/Export into `variant="ghost"` icon-only buttons on small screens (keep label on `sm:`), tightening the bar.
   - Slight `rounded-full` on these to match the softer feel.

6. **Apply the same treatment to the Cost Tracker header** (`src/components/ProjectTracker.tsx`) so navigation between the two pages feels consistent — same gradient bar, gradient logo tile, and sparkle, but with its own tagline (e.g. "Stay on budget, stress-free").

## Out of scope
- No changes to `TopNav`, theme tokens, or page body content.
- No new dependencies; uses existing `lucide-react` icons and Tailwind classes.

## Files to edit
- `src/components/moodboard/MoodboardPage.tsx`
- `src/components/ProjectTracker.tsx` (header section only)
