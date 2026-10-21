## Context

`new-recipe/route.tsx` seeds the editor with `emptyDraftSeed`. The calling name lives in `users` (`getUser(db, email)`). The welcome gate means a member reaching this route always has a user record.

## Decisions

- **Loader returns the calling name; the route builds the seed.** `initial={{ ...emptyDraftSeed, author: callingName }}`. Alternative: prefill inside `RecipeEditor` from a prop. Rejected: the editor is shared with edit, and `initial` already is the "stored" baseline.
- **Prefilled seed is the baseline for dirty checks.** Because `initial` carries the author, an untouched form equals `initial`, so no draft is stored (existing `recipe-draft` rule) and the leave confirmation does not fire. No change to draft code.
- **Draft and refused submission win.** A restored draft or `actionData.values` already override the seed; nothing to add.
- **Missing user falls back to empty.** `getUser` can return `undefined` only if the welcome gate is bypassed (e.g. tests); use `''` then.

## Risks

- A member who changes their mind about the calling name later has older drafts with the old name. Drafts hold the typed value, so this is harmless.
