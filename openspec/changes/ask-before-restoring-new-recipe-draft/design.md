## Context

`RecipeEditor` reads the draft once in a layout effect on mount (`loadDraft`, `resolveStart`) and restores it at once. A new recipe and the import page share one key (`draftKey(email)` without slug), so both see the same draft. `useDraftPersistence` writes nothing until `ready` is true, and `resolveStart` already returns the state to show.

## Goals / Non-Goals

**Goals:** ask before a new recipe's draft is restored; keep the stored-recipe flow untouched; no write to the device before the choice.

**Non-Goals:** drafts of stored recipes, several drafts, a new draft format.

## Decisions

- **Hold the start, do not change `resolveStart`.** For a new recipe (`slug === undefined`) the mount effect computes the start as today but, when it would restore (`restoredAt` set), stores it in `pending` state instead of applying it, and leaves `ready` false. Use applies the held start exactly as the effect does today and sets `ready`. Discard calls `clearDraft`, then sets `ready`. Alternative considered: a route-level gate before the editor mounts; rejected because the draft is read from `localStorage` in the browser only, and the editor already owns that read.
- **`ready` false covers "nothing is written".** `useDraftPersistence` skips every write until `ready`, including the page-hide and unmount flush, so the offered draft cannot be overwritten by the empty form.
- **Leave guard.** The form is not dirty while the popup is open, so no leave confirmation fires; the draft stays on the device and is offered again next time.
- **Component.** `RestoreDraftDialog` in `lib/`, same `<dialog>` + `showModal()` pattern as `DeleteRecipe`, opened by an effect when `pending` is set. Props: the draft's `RecipeDraft`, `savedAt`, `onUse`, `onDiscard`. No backdrop-click close. Escape fires `cancel`; its default is prevented so the popup stays. The photo uses `draft.image` as `src`, as `PhotoField` does for its `value`.
- **What it shows.** Name, servings, source, photo; first 3 non-blank ingredient texts and first 2 non-blank step bodies, with "+ N meer" when more. Empty fields are left out. It also shows when the draft was kept, via the existing `describeSavedAt`.
- **Copy** in Dutch like the rest: "Je hebt nog een onafgemaakt recept", "Gebruik concept", "Weggooien".

## Risks / Trade-offs

- A draft that holds only an uploaded photo or only whitespace is still offered; its popup then shows little. Accepted: a draft is only kept when it differs from the empty form.
- The import-recipe-from-url scenario "Imported content is kept as a draft" gets one more click in its test. The scenario text still holds after the choice.
