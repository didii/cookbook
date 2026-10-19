# Proposal

## Why

Ingredients can be stored but not entered: the temporary form has no way to type, reorder or remove them. The ingredient list is the first thing typed on a new recipe, so it has to be the fastest part of the screen: one line per ingredient, as you would write it on paper, with the app working out the quantity from what you typed. This is board card #7 ("Create/edit ingredient list"). It builds on the shell from `edit-recipe-basics` and is needed by `edit-recipe-chips` (which links step chips to these rows).

Order: `edit-recipe-basics` → this → `edit-recipe-steps` → `edit-recipe-chips` → `edit-recipe-local-save`. Independent of `edit-recipe-picture`.

## What Changes

- An "Ingrediënten" section in the editor's main column: one single-line field per ingredient, typed as "250 g zelfrijzende bloem". The app splits each line live into a quantity ("250 g", shown in blue inside the field itself) and a name, so the family member sees at once whether the amount was recognised. Dutch only; pasting a whole list is out of scope.
- Always one empty row at the end; typing in it adds the next. Enter moves to the next row, the up and down arrow keys move between rows, Backspace on an empty row removes it, each row has a delete button. Tab is left alone.
- Always-visible stacked up/down arrow buttons beside a drag grip, left of each field. Dragging with the grip works with a mouse or pen; on touch screens the grip is hidden and the arrows are the way to reorder. Moves are announced to screen readers.
- The list is saved with the recipe: quantity text, amount and unit are stored for each row in order, blank rows are dropped, and a row with a quantity but no name is refused with a message on that row. Editing a recipe loads its stored ingredients back as lines.
- Each row's buttons are one keyboard toolbar (one Tab stop, arrow keys inside), and Alt+↑/Alt+↓ moves a row from its field.
- A slot under each row for the "Gebruikt in stap N" line; the line itself is filled by `edit-recipe-chips`.

## Capabilities

### New Capabilities
- `recipe-ingredient-editing`: typing, parsing, reordering, removing and saving the ingredient list of a recipe.

### Modified Capabilities
<!-- none: the stored shape of an ingredient is unchanged (recipe-storage already holds quantity text, amount and unit) -->

## Impact

- New `app/lib/ingredients.ts` (parser shared by browser, server and later the chips), `app/shared/recipeEditor/IngredientList.tsx` and row/overlay components, `Draft` gains `ingredients`, `shared/recipeValidation.ts` (parse and validate the posted list), `.server/recipes.ts` (`updateRecipe` replaces the ingredient rows; `createRecipe` already accepts them), both route actions and loaders.
- Replacing an edited recipe's ingredient rows removes the (currently unused) `step_ingredients` links to them, as `recipe-storage` already specifies for deleted ingredients.
- No schema change, no new dependency.
