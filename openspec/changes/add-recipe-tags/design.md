# Design

## Context

Categories exist since `add-recipe-categories`: `categories(id, name NOCASE UNIQUE)` and `recipe_categories(recipe_id, category_id, position)`. `listRecipes` returns them, the card shows them, nothing writes them except `dev.sql`. `createRecipe`/`updateRecipe` do not touch them. The editor already posts ingredients and steps as JSON in hidden inputs (`readIngredients`, `readSteps`), suggests authors with `AuthorInput` (Base UI `Autocomplete`), and keeps its whole state as a `RecipeDraft` (`draft.ts`) that is stored on the device (`draftStore.ts`). See proposal.md for why.

## Goals / Non-Goals

**Goals:**
- Tags are the existing categories under a new name, so the later `categories` table (a group a tag can belong to) has no name clash.
- Pick, create and remove tags in the editor, saved atomically with the recipe.

**Non-Goals:**
- No `categories` table or `tags.category_id` yet: nothing reads it until the tag manager, so it lands in that change.
- No cleanup of unused tags, no limit on the number of tags.

## Decisions

**Rename in place, one migration.** `ALTER TABLE categories RENAME TO tags`, `recipe_categories` → `recipe_tags`, `RENAME COLUMN category_id TO tag_id`, `DROP COLUMN position` (tags are shown alphabetically, nothing keeps an order). SQLite and D1 keep rows, the unique index, the primary key and the foreign keys (SQLite rewrites references on rename). Alternative: create new tables and copy: more SQL, same result.

**Tags are posted as a JSON list of names, in a hidden input `tags`** (like `steps`). `readTags(form)` returns `string[] | undefined`; a missing or malformed field is `undefined` = keep stored tags, an explicit `[]` clears them. This matches how `ingredients` and `steps` already behave, so a client that does not send the field cannot wipe tags. The server trims, drops blanks and drops case-insensitive duplicates; it never trusts the client's split. A tag over 100 characters is an error on the `tags` field (`RecipeFormErrors.tags`), and the input has `maxLength` 100.

**Tag resolution happens in SQL, in the recipe's batch.** For each name: `INSERT OR IGNORE INTO tags (name)` (the NOCASE unique index makes "soep" collide with "Soep", so the stored spelling wins), then `INSERT OR IGNORE INTO recipe_tags (recipe_id, tag_id) SELECT …, id FROM tags WHERE name = ?` (OR IGNORE also covers a tag given twice) (NOCASE comparison). `updateRecipe` first `DELETE FROM recipe_tags` for the recipe when tags are given. All in the existing `db.batch`, so a save is atomic. Alternative: look up in JS first: extra round trip and a race between two saves.

**Suggestions come from the loaders.** `listTags(db)` (ordered by name, NOCASE) is added to the loaders of the new and edit routes, next to `listAuthors`, and passed to the editor as `tags`.

**The field is a new shared-nothing component in the edit-recipe route: `TagInput`, built on Base UI `Combobox` with `multiple`, `Combobox.Chips`/`Chip`/`ChipRemove`.** The controlled value is `string[]`. It is only used by the editor, so it lives in `edit-recipe/lib/` (move to `shared/` when a second route needs it). Base UI's combobox has no free-text value, so the new tag is an extra item: when the typed text (trimmed) matches no stored tag and is not picked yet, the items list gets one more entry `Toevoegen: "<text>"`. Enter on the input with a typed text and no highlighted item picks the matching stored tag if there is one (so "soep" picks "Soep"), otherwise creates it. Items already picked are filtered out of the list. Alternative: `Autocomplete` plus our own chips, rejected: the combobox already gives chip keyboard navigation (Backspace removes the last chip) and the right ARIA.

**Two orders. Alphabetical in `shared/tags.ts` (`sortTags`, `Intl.Collator('nl', { sensitivity: 'base' })`)**, used by `getRecipe`, `listTags` after reading (SQL `NOCASE` ignores only ASCII case, not accents) and by the editor when a tag is picked, so server and editor agree. Alternative: `ORDER BY name COLLATE NOCASE` in SQL: mismatches the editor for accented names.

**Most used first for the card, in `listRecipes` only.** Each tag is read with its use count (`(SELECT COUNT(*) FROM recipe_tags WHERE tag_id = t.id) AS uses`), then sorted by `uses` descending and by the same collator for ties (`tags.ts` exports the compare function next to `sortTags`, so ties match the alphabetical order). The count is global, so every card has the same relative order. Nothing is stored and there is no schema change. Alternative: a stored rank per tag or category: manual upkeep, rejected for now.

**The draft gets `tags: string[]`.** `RecipeForm` is `Record<RecipeFormField, string>`, the server's validated text, so tags stay out of it. They are a list like ingredients: `DraftSeed`/`RecipeDraft` get a `tags` field next to `ingredients`/`steps`, and `emptyDraftSeed` gets `tags: []`. `normalize` (used by `isDirty`) includes tags. The editor keeps the list sorted, so the order picked is not a change. A stored draft without `tags` is read as `[]` in the draft store's loader so old drafts restore.

**`Recipe` gets `tags: string[]`** from `getRecipe` (the edit loader seeds the draft from it). `RecipeSummary.categories` → `tags`; `RecipeCard` test ids `RecipeCard-categories`/`RecipeCard-category` → `RecipeCard-tags`/`RecipeCard-tag`.

**Spec scenario names:** scenarios renamed from "categories" to "tags" in `recipe-storage` and `recipe-browsing` keep their tests: rename the `describe`s in the same task as the code.

## Risks / Trade-offs

- [A second save races a new tag] → `INSERT OR IGNORE` plus the unique index makes both end up on the same tag.
- [Popular generic tags (e.g. "Hoofdgerecht") may always fill the card] → accepted; evaluate once enough recipes exist (board #50). A category can become the first sort key later; the card order lives in `listRecipes` only.
- [With few recipes all counts tie] → the alphabetical tie-break makes the order equal to alphabetical.
- [The card order changes as recipes are added] → expected.
- [Typo tags pile up: "Soepen", "soep "] → trimming and NOCASE cover the cheap cases; the tag manager (next change) has rename and merge for the rest.
- [Combobox free-text feel on phones: the "Toevoegen" item sits under the keyboard] → the popup lists it first, directly under the input; verify by hand on a phone-width viewport.
- [Unused tags stay forever] → they show up as suggestions; the tag manager deletes them.

## Migration Plan

One migration, `0013_recipe_tags.sql`, renaming in place; no data copy. Rollback is the reverse renames. `dev.sql` is updated to the new names.
