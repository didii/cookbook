# Proposal

## Why

The create/edit form was a temporary page to get functionality running: one narrow column, fields stacked, a single submit button. Recipes will now be typed mostly on a desktop, in one sitting, so the screen has to be a real editor: one page, everything visible, nothing to click through, and an explicit way to save, cancel or start over. This change builds that shell and the base fields; the picture, ingredients, steps, chips and local drafts are separate changes that plug into it.

This is the first of six changes that replace the temporary form, in this order: `edit-recipe-basics` → `edit-recipe-ingredients` → `edit-recipe-steps` → `edit-recipe-chips` → `edit-recipe-local-save`, with `edit-recipe-picture` independent of the middle three (it only needs this shell). Board cards: #9 (description), #16 (times and servings); the shell itself has no card.

## What Changes

- `RecipeForm` is replaced by a `RecipeEditor` page shared by `/recepten/nieuw` and `/recepten/<slug>/bewerken`. Same editor for both; only the starting values differ.
- Layout: a main column (title as a large inline field, intro, and later the ingredients and steps) and a right rail (author, servings, time, and later the photo). On a narrow screen the rail comes first, so a phone user lands on photo and facts.
- A sticky save bar with **Opslaan** (primary) and **Annuleren**, and a quiet **Herstel** (reset) button that appears only when something changed. Reset asks once, inline ("Alles terugzetten? Ja / Nee"), then puts every field back to its starting values (stored values for an edit, empty for a new recipe).
- A "Niet opgeslagen" indicator in the bar while the page differs from its starting values, and a browser confirmation when leaving with unsaved changes.
- Nothing is stored until Opslaan. Validation, error text and focus handling stay as they are today (title and author required, servings a whole number of at least 1).
- The "required" asterisk and its explanation stay visible even though the title is now a large inline field.

## Capabilities

### New Capabilities
- `recipe-form`: the one editing page for creating and editing a recipe: layout, explicit Save, Cancel, Reset, unsaved-changes flag and guard.

### Modified Capabilities
- `recipe-editing`: the edit form shows the stored values of the whole recipe (no longer an enumerated list of base fields) and keeps ingredients and steps unless the family member changed them, so later changes do not have to modify this requirement again.

## Impact

- `app/shared/RecipeForm.tsx` replaced by `app/shared/recipeEditor/` (`RecipeEditor.tsx`, `SaveBar.tsx`); `routes/new-recipe/route.tsx` and `routes/edit-recipe/route.tsx` render it; `app/lib/draft.ts` (dirty check, starting values).
- No schema change, no new dependency. Existing form tests keep their meaning; button labels change to "Opslaan".
