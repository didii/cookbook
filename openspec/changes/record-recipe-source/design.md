# Design

## Context

`recipes` has `author` (required, "van wie") and optional `time`, `servings`, `intro`, `image`. The editor reads those through `readForm`/`validate`/`toRecipeFields` in `recipeValidation.ts`, keeps them in a local draft (`draft.ts`, `draftStore.ts`, which rejects a stored draft whose string fields are not all strings), and `recipes.server.ts` reads, creates and updates them. `RecipeView` shows author, time and servings in one row. See proposal.md.

The in-flight `limit-field-sizes` change adds `0016_size_limits.sql`, which rebuilds `recipes` with `CHECK`s, and adds length limits in `recipeValidation.ts`.

## Goals / Non-Goals

**Goals:**
- One optional text field that holds a name or a link, shown as a link only when it safely is one.

**Non-Goals:**
- Separate fields for a name and a URL, link validation or fetching, source on cards, suggestions of earlier sources.

## Decisions

- **One free-text column, `source TEXT`, null for none.** The card says "who it came from, or a link": one field covers both. Two columns would force a choice per recipe and a second input for little gain. Same shape as `time`, so empty becomes null the same way.
- **Link detection at render time**, not stored: a trimmed value matching `^https?://\S+$` and parsing with `new URL`. Anything else, including `javascript:`, is text. React escapes text, and the `href` only ever holds an `http(s)` URL, so no script URL can reach it. The link text is the host without `www.`, which keeps long addresses from breaking the layout; the full address is the `href`. The link gets `target="_blank"` and `rel="noopener noreferrer"`. The check is a small pure function beside `RecipeView` with its own unit test.
- **500-character limit** with a database `CHECK`, the editor `maxLength`, and a server check with a message, like the tag limit (`maxTagLength`, `tagError`). A URL can be long, so the limit is above the 100–200 of the short fields.
- **Place in the form: side column below the author**, as both are about where a recipe comes from. In the view, after servings in the same row, so the row stays one line of facts.
- **Old drafts load.** `isStoredDraft` requires the listed fields to be strings; `source` is read as optional there and defaults to `''`, as is done for `tags`, so no draft kept before this change is thrown away. The draft `version` stays.
- **Migration is `ALTER TABLE recipes ADD COLUMN source TEXT CHECK (source IS NULL OR length(source) <= 500)`**: SQLite allows a column `CHECK` on `ADD COLUMN` when the existing rows pass it (null does). No rebuild, no data copy.

## Risks / Trade-offs

- [Both this change and `limit-field-sizes` use migration number 0016, and its rebuild of `recipes` copies a fixed column list] → Whichever is applied second renumbers its migration; if that is `limit-field-sizes`, it adds `source` (with the same `CHECK`) to its rebuilt table and copy list and to its length table. Say so in the PR of the second one. Not done here, because that change is not merged.
- [A pasted link with tracking parameters or a trailing space] → The value is trimmed; the address is stored as typed.
- [Free text such as "zie https://…" is not a link] → Accepted; the user can paste the bare address.
