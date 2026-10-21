# Proposal

## Why

A family member cannot yet mark a recipe as a favorite or jot down their own tweaks ("less salt, ten minutes longer") where they cook from it. Card #19 asks for personal data on a recipe. This change adds it to the recipe page; showing it on the home page, and searching on it, is a separate follow-up change.

## What Changes

- A heart button in the top row of the recipe page lets a member like a recipe and unlike it again. Liking is stored per member and recipe.
- A member can keep one private note per recipe. On a narrow screen a floating button opens a field above it; on a wide screen the note sits under the ingredients, always visible. Dismissing the field (a tap outside it or on the button again) or leaving the wide field saves the note, and so does a pause in typing (2 s wide, 5 s narrow), since there is no save button. On a narrow screen the hint under the field turns into "Bewaard" once nothing is left to save.
- A short "Notitie bewaard" cue appears only when the note actually changed. It fades by itself after a delay, and a tap removes it at once. Opening the field to read it and closing it shows nothing and saves nothing.
- A member's like and note are visible to that member only.
- **BREAKING (layout):** on a wide screen the ingredient column no longer stays in view while the steps scroll, and its list no longer scrolls by itself. Timers, ingredients and the note scroll with the page. A growing note field would otherwise flip a sticky column between sticky and not sticky.

## Capabilities

### New Capabilities
- `recipe-like`: a member likes and unlikes a recipe with a heart button on the recipe page; the like is private to the member.
- `recipe-note`: a member keeps one private note per recipe, edited on the recipe page, saved on dismissal, with a saved cue that only follows real changes.

### Modified Capabilities
- `recipe-viewing`: on a wide screen the ingredient column scrolls with the page instead of staying in view, and the long-list rule (inner scroll) goes away.

## Impact

- D1: one migration with `recipe_likes (user_id, recipe_id)` and `recipe_notes (user_id, recipe_id, body)`, both cascading on user and recipe delete.
- Server: queries in `app/.server/recipes.ts` (or a new sibling module); the recipe loader returns `liked` and `note` for the signed-in member; two action routes to save a like and a note.
- UI: `routes/recipe/RecipePage.tsx` (heart in the top row, wide layout without sticky), new `LikeButton`, `NoteField` and a saved-cue component, icons in `shared/icons.tsx`.
- Docs: the approved mockups are added as `docs/design/recipe-like-note-narrow.html` and `recipe-like-note-wide.html`, listed in `docs/design/README.md`.
- Tests: component tests for the heart, note field and cue; DB tests for the new tables; the two `recipe-viewing` scenarios are updated (same titles, new text); wide-layout ones stay `test.todo`.
- Out of scope: home page indicators, the card redesign for recipes without a photo, and filter/search on favorites and notes (follow-up change).
