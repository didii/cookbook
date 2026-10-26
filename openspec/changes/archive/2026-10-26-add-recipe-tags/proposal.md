# Proposal

## Why

Recipes have no way to be labelled ("dessert", "vegetarian", "Christmas") from the app: the existing `categories` are only seeded. The family should be able to tag a recipe while editing it, and to make up new tags on the spot.

## What Changes

Change 1 of 2. The tag manager screen (add, rename, delete, merge, assign a category to a tag) is a separate change that follows this one.

- The seeded `categories` become **tags**: `categories` → `tags` and `recipe_categories` → `recipe_tags`, keeping all stored data. The word "category" is freed for a later, separate concept: a tag can get one optional category, set in the tag manager (that change adds the `categories` table and `tags.category_id`).
- `RecipeSummary.categories` becomes `tags`; the card shows tag pills (spec wording only; same look).
- The recipe editor (new and edit) gets a "Tags" field in the side column: a multi-select with autocomplete over the stored tags. Typing a name that does not exist offers to add it as a new tag.
- Saving a recipe stores its tags . A tag is at most 100 characters; a longer one refuses the save. There is no limit on the number of tags. A tag typed in another letter case than a stored tag takes the stored spelling. New tags are created on save, not before.
- Tags have no stored order. The card shows a recipe's tags most used first (the number of recipes that have the tag, ties alphabetical), so the two it shows are the most telling. Reading a recipe, the editor's picked tags and the suggestions stay alphabetical (letter case and accents ignored). The link table loses its `position` column. Grouping by category is for later (card #50).
- The tags are part of the editor's draft, dirty check and Herstel, like every other field.
- Out of scope: the tag manager screen, categories, filtering by tag, showing tags on the recipe page, deleting tags no recipe uses any more (the manager does that).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `recipe-storage`: "A recipe has categories" becomes "A recipe has tags", and creating or updating a recipe stores its tags.
- `recipe-browsing`: the card's categories become tags (wording only).
- `recipe-form`: the editor has a Tags field.
- `recipe-draft`: the draft includes the tags.

## Impact

- DB: one migration renaming the tables and the link column; `src/db/seed/dev.sql`; `src/db/migrations/migrations.test.ts`; `src/db/seed/dev.test.ts`.
- `shared/recipes.server.ts` (`listRecipes`, `getRecipe`, `createRecipe`, `updateRecipe`, new `listTags`), `shared/recipe.ts` (`Recipe`, `RecipeSummary`) and tests.
- Editor: `edit-recipe/lib/RecipeEditor.tsx`, `draft.ts`, `recipeValidation.ts`, a new tag field component, `EditRecipePageRoute.tsx`, `NewRecipePageRoute.tsx`.
- Home: `RecipeCard.tsx` (prop and test ids `categories` → `tags`).
- Existing drafts in local storage have no tags; they must still restore (missing tags read as none).
