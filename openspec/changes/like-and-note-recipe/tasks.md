# Tasks

Each scenario test is named `<capability> › <Scenario title>`; run `pnpm test:spec like-and-note-recipe` to see which still lack one. Use `pnpm test:ai` to run tests.

## 1. Data

- [x] 1.1 Add `migrations/0008_recipe_likes_notes.sql` with `recipe_likes` and `recipe_notes` (composite primary keys, `ON DELETE CASCADE` on user and recipe, non-empty `body` check, `updated_at`). Verify in `migrations/migrations.test.ts`: `recipe-like › Liking twice stores one like`, `recipe-like › Deleting a recipe removes its likes`, `recipe-note › Deleting a recipe removes its notes`, plus a test that a blank body is rejected.

## 2. Server

- [x] 2.1 Add `getMemberRecipeData`, `setLike` and `setNote` (note: trimmed-empty deletes the row; refused above 4000 characters) next to `recordView` in `app/.server`. Verify with DB tests in `recipes.test.ts`: `recipe-like › Liking a recipe`, `recipe-like › Unliking a recipe`, `recipe-like › Another member's like`, `recipe-note › Another member's note`, `recipe-note › Changed note is stored`, `recipe-note › Emptied note is removed`, and unknown recipe or member being refused. Also in `migrations.test.ts`: `recipe-like › Removing a member removes their likes`, `recipe-note › Removing a member removes their notes`.
- [x] 2.2 Add the action-only routes `recepten/:slug/favoriet` and `recepten/:slug/notitie` in `app/routes.ts` (404 unknown recipe, 403 member without a user row, 413 too long, 400 invalid `liked`) and return `{ liked, note }` from the recipe loader. Verify with route tests calling the real `action` and `loader` against an in-memory D1 (pattern: `routes/recipe/route.test.ts`).

## 3. Like button

- [x] 3.1 Add `Heart`, `StickyNote` and `Lock` to `shared/icons.tsx`.
- [x] 3.2 Add `LikeButton` in `routes/recipe` (fetcher, optimistic from `formData`, `aria-pressed`, accessible names "Markeer als favoriet" / "Verwijder uit favorieten", 44px target, `press`) and place it before `Bewerk` in the top row of `RecipePage`, as in `docs/design/recipe-like-note-narrow.html`. Verify with component tests: `recipe-like › Recipe not liked`, `recipe-like › Recipe liked`, `recipe-like › Like cannot be saved`.

## 4. Note

- [x] 4.1 Add `useNote` (text, opened value, one save request at a time through a fetcher, debounced autosave of 2 s wide / 5 s narrow, `savedSinceOpen`, failure flag, saved cue with fade timer, tap to clear, save on `pagehide`). Verify with hook-level tests using fake timers: `recipe-note › Unchanged note is not stored`, `recipe-note › Autosave after a pause`, `recipe-note › Typing restarts the pause`, `recipe-note › Autosave waits longer on a narrow screen`, `recipe-note › Dismissing replaces a waiting save`, `recipe-note › Cue after a change`, `recipe-note › No cue without a change`, `recipe-note › Cue fades out`, `recipe-note › Tapping the cue removes it`, `recipe-note › Note cannot be saved`, `recipe-note › Saving while open shows no cue after dismissing`, and one test that `pagehide` sends a keepalive save. Hook tests mock `useNarrow`.
- [x] 4.2 Add `NoteSheet` (narrow: fixed button with marker, field above it, closes on outside tap, button and Escape, focus in and back, close button state, the hint that turns into "Bewaard") and mount it in `RecipePage`. Build it to match `docs/design/recipe-like-note-narrow.html`. Verify with component tests: `recipe-note › Recipe without a note`, `recipe-note › Recipe with a note`, `recipe-note › Opening the note field`, `recipe-note › Closing by tapping outside`, `recipe-note › Closing with the button`, `recipe-note › Hint while there is unsaved text`, `recipe-note › Saved replaces the hint`, `recipe-note › Typing brings the hint back`, `recipe-note › Opening alone shows the hint`. Check on a narrow viewport that the button clears the page bottom, `CookSwitch` and `TimerDock` (browser check, noted in the PR).
- [ ] 4.3 Add `NotePanel` (wide: under the ingredient list, always visible, saves on blur and after the pause, cue inside the panel, "Alleen voor jou") and mount it in the ingredient section. Build it to match `docs/design/recipe-like-note-wide.html`. Verify with component tests: `recipe-note › Note panel on a wide screen`, `recipe-note › Leaving the field saves`, `recipe-note › Wide save failure shows a message`.

## 5. Wide layout

- [ ] 5.1 Remove the sticky position, `max-h` and inner scroll from the ingredient section and its list in `RecipePage`. Verify: the two `recipe-viewing` scenarios (`Two columns on a wide screen`, `Long ingredient list on a wide screen`) stay `test.todo` with their updated reasons, a component test asserts the section no longer has `sticky` or an overflow class, and a browser check at 1280×600 with many ingredients and a running timer scrolls the whole page.

## 6. Finish

- [ ] 6.1 Run `pnpm format:fix`, `pnpm lint:fix`, then confirm `pnpm format:check`, `pnpm lint:check`, `pnpm test:ai` and `pnpm test:spec like-and-note-recipe` are clean. Verify by their output.

## Workflow follow-up

- Open the PR, move card #19 to `review`, and add a card for the home page part (indicators, card redesign for photo-less recipes, search on favorite/notes).
- Archive the change after the PR is merged.
