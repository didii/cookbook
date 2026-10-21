# Design

## Context

See proposal.md for the why. Today:

- A per-member fact already exists: `recipe_views (user_id, recipe_id)`, written in the recipe loader through `recordView(db, email, slug)`, which resolves the member from `userEmailContext` and silently does nothing for an unknown member or recipe.
- The recipe route has one `action` (delete). `foto` is an example of an action-only resource route outside the layout.
- `RecipePage` keeps its state in the page (ticked ingredients, servings, tab, cook mode) and switches wide/narrow layout with CSS (`min-[52rem]:`), not with JS. `useNarrow` exists only for behaviour that must differ.
- On a wide screen the ingredient section is `sticky top-4`, has `max-h-[calc(100svh-2rem)]` and the list scrolls inside it (`recipe-viewing`, "Long ingredient list on a wide screen").
- Shadowed buttons use `press` and the ink border, hard shadow tokens from `app.css`. Icons come from Lucide through `shared/icons.tsx`.
- The approved mocks are in the repo as `docs/design/recipe-like-note-narrow.html` (heart in the top row, floating note button, the field while typing, the field saved, the toast) and `docs/design/recipe-like-note-wide.html` (option A: note panel under the ingredients), described in `docs/design/README.md`. They are the visual reference for the implementation; tokens in `app.css` win where they differ. The same mocks are in the private Artifact "Cookbook likes and notes" (https://claude.ai/artifact/CMDsakVtQjhjYjiUiEKK8R). Sample text in them is made up.

## Goals / Non-Goals

**Goals:**
- Private like and note per member and recipe, saved without leaving the page.
- Same save rule on narrow and wide screens: save a real change, say so once, say nothing otherwise.

**Non-Goals:**
- Home page indicators, card redesign for photo-less recipes, search and filter on likes or notes (follow-up change). The data model here is what that change reads.
- Note history, formatting, sharing a note, several notes per recipe.
- Offline saving or retry queues.

## Decisions

**1. Two small tables, one row per member and recipe.**
`recipe_likes (user_id, recipe_id)` with a composite primary key, and `recipe_notes (user_id, recipe_id, body)` with `body TEXT NOT NULL CHECK (length(trim(body)) > 0)`, both with `ON DELETE CASCADE` on user and recipe, plus `updated_at` on notes. Same shape as `recipe_views`. A like is a row's existence; an emptied note deletes the row, so "no note" has exactly one representation.
*Alternative:* one `recipe_member_data` table with `liked` and `note` columns. Rejected: it mixes two lifecycles and the follow-up search wants cheap `EXISTS` checks on each.

**2. Writes are idempotent "set" requests, on two action-only routes.**
`POST /recepten/:slug/favoriet` with `liked=true|false` and `POST /recepten/:slug/notitie` with `note=<text>`, registered next to `foto` (outside the layout, no UI). The like request states the wanted value instead of toggling, so a double tap or a retry cannot flip the heart back. Both resolve the member through `userEmailContext`, answer 404 for an unknown recipe and 403 for a member without a user row. The note body is trimmed of trailing whitespace only for the emptiness check, stored as typed, and refused with 413 above 4000 characters (a trust boundary; the field has `maxLength` too). A `liked` value other than `true` or `false` is answered with 400.
*Alternative:* an `intent` field on the recipe route's existing `action`. Rejected: that action is the delete contract today, and a mis-sent form should not be one field away from a delete.

**3. The loader returns the member's data with the recipe.**
`getRecipe` stays member-free. A new `getMemberRecipeData(db, email, slug)` returns `{ liked, note }` and the loader adds it to its result, next to `recordView`. `RecipePage` gets `liked` and `note` props.

**4. Heart: optimistic, from the fetcher.**
`LikeButton` submits through a `useFetcher` and shows `fetcher.formData` while pending, falling back to the loaded value. When the request fails, `formData` disappears and the button shows the stored value again, which is the "Like cannot be saved" scenario for free. The loader revalidates after the action, so the stored value wins.

**5. One note state in the page, two presentations.**
A `useNote(slug, saved)` hook in the recipe folder owns the text, the value the field was opened with, the save request (fetcher), the failure flag and the cue. `RecipePage` calls it once and passes it to `NotePanel` (wide: inside the ingredient section, `max-[51.99rem]:hidden`) and `NoteSheet` (narrow: fixed button and field, `min-[52rem]:hidden`). Both are mounted and CSS shows one, like the rest of the page, so server and browser render the same markup and no `useNarrow` is needed. `useNote` is the only place that decides "changed since opened"; the components only call `open()`, `dismiss()` and `blur()`.
*Alternative:* render one presentation chosen by `useNarrow`. Rejected: the server assumes narrow, so wide screens would hydrate into a different tree.

**6. Dismissal is plain state, not the Popover API.**
The sheet is open when `open` is true; a `pointerdown` listener on the document closes it when the target is outside the sheet and the button, Escape closes it, and the button toggles it. Focus moves into the textarea on open and back to the button on close. The native `popover` attribute would give light dismiss for free, but the test environment (happy-dom) does not run it, and the spec scenarios would then only be testable in a browser. This is the choice to revisit if the component tests prove the Popover API works there.
Wide screens save on `blur` of the textarea; `dismiss()` and `blur()` call the same `save()` which compares against the opened value.

**7. Autosave and the saved cue live in `useNote`, not in the components.**
There is no save button, so typing saves by itself: every change restarts a debounce timer, and when it fires `save()` runs. The pause is 2 seconds on wide screens and 5 seconds on narrow ones (slower typing, and a save mid-sentence is more annoying there). The hook picks it with `useNarrow`, which is acceptable here because it only changes a number, not the markup. Dismissal, blur and `pagehide` call the same `save()` and clear the timer, so a note is stored once. `save()` does nothing when the text equals the last stored value, and never runs two requests at once: if one is in flight it marks the note dirty and saves again when that one returns.
The note text is local state that starts from the loader's `note` and is not synchronised with it afterwards, so the loader refresh that follows each save cannot overwrite what is being typed.
`useNote` also exposes `savedSinceOpen`: true after a save that completed since the field was opened and the text has not changed since. The narrow field shows "Bewaard" instead of the hint when it is true (spec: "The narrow field says when everything is saved"), and the hint again as soon as the text changes. The toast is only shown when a save completes while the field is closed, so the two never double up.
After a successful save of a changed note, `cue` becomes true. A timer of about 3 seconds starts the fade (a CSS animation, `animate-fade` in `app.css`, switched off with `motion-reduce`, where the timer just removes it); the cue is removed on `animationend` or after the same timer plus the animation length under reduced motion. Clicking the cue clears it and the timer at once. A new successful save restarts it. The cue is a `<button>` inside `role="status"`, so it is announced and reachable, and tapping it needs no new pattern.

**8. Wide layout: remove sticky and the inner scroll.**
The ingredient section loses `min-[52rem]:sticky`, `top-4`, `max-h` and the flex/overflow classes on the list. The page is the only scroller. A sticky column that depended on its own height would flip between sticky and not sticky as the note field grows or timers start, which is confusing; removing it is also less code. `TimerSidebar` and the cook-mode scroll logic keep working because they only read the position of the first item.

**9. Icons and tokens.**
`Heart` (filled via `fill-current` when liked), `StickyNote` and `Lock` are added to `shared/icons.tsx` the way the others are. The liked heart is `bg-red text-white`, the note button `bg-yel`, the open (close) state `bg-red text-white`, using the existing `press` helper and `aria-pressed`/`aria-expanded` styling per the `button-press` rules. No new colours.

## Risks / Trade-offs

- [Saving on dismissal and after a pause can still lose text when the tab closes or the connection drops] → Also save on `pagehide` when the text differs from the stored value (`navigator.sendBeacon`-style keepalive fetch); on failure the field stays open with the text and a visible message (spec: "Note cannot be saved"), and the dirty text is retried on the next dismissal or pause.
- [An autosave while typing can race with the next keystrokes or a reload of the loader] → One request at a time, and the text is never taken back from the loader (decision 7).
- [The 2 s and 5 s pauses are guesses] → They are two constants in `useNote`; tune after trying on a phone.
- [The floating button can cover content or the cook-mode switch on small phones] → The narrow page already has `pb-16` on each panel; the button sits inside that space, and the implementation checks it against `CookSwitch` and `TimerDock` on a narrow viewport.
- [Both note presentations mounted means two textareas in the DOM] → The hidden one is `display: none`, so it is neither focusable nor read; both bind to the same state so they never disagree after a resize.
- [Dropping the sticky ingredient column is a visible regression for people who liked it] → Accepted by the product owner for this change (a long column otherwise had to scroll inside itself); the ingredients are still one tab away on narrow screens.
- [Home-page search will want note text in the list payload] → Out of scope; the tables allow it with one extra join.

## Migration Plan

One migration, `0008_recipe_likes_notes.sql`, adds both tables; nothing existing changes, so rollback is dropping the tables. The migration test list in `migrations/migrations.test.ts` gets the cascade checks. Deploy migration, then code.
