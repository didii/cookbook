# Proposal

## Why

The recipe view shows each step with chips: its ingredients, an oven temperature and a timer. Today those exist only in hardcoded sample data; the database cannot store them and the editor cannot produce them. Typing them again in separate fields would be exactly the friction this screen must avoid, since they are already written in the step's own words ("kneed bloem, boter en suiker", "30 minuten", "180 graden"). So chips follow the words: they appear while typing, change when the words change and vanish when the words do, yet a family member keeps full control: any chip can be pinned, edited by hand or created from scratch, and a pinned chip never changes behind their back, it only proposes. This is the hardest of the six changes and builds on all of `edit-recipe-basics`, `edit-recipe-ingredients` (the rows chips link to) and `edit-recipe-steps` (the mark layer and edit reports). `edit-recipe-local-save` comes after it.

## What Changes

- **Recognition (Dutch only):** a duration in a step becomes its timer ("30 minuten", "1,5 uur", "een half uur", "20-25 minuten"), a temperature its oven chip ("180 graden", "180 °C"), and the name of a recipe ingredient, singular or plural, an ingredient chip. One oven and one timer per step, one chip per ingredient per step.
- **Amounts on ingredient chips:** the amount written in the step before the name, else the quantity of the ingredient's row if only this step uses it, else just the name. Following chips track the list: a changed quantity updates them, a renamed or removed row drops them.
- **Anchors:** each chip is tied to the words that justify it, followed through every edit by the exact replaced range of the edit (text before moves the anchor, text inside stretches it, text typed at an edge stays outside, replacing all of the words moves the anchor to the new words, deleting them loses it), not by character position. Anchors live in the editor only; nothing about them is stored.
- **Two kinds of chip:** a following chip (link icon, no controls) is a pure function of its words; a pinned chip (pin icon) holds its values and, when its words change or vanish, shows a proposed change or removal with a small joined accept/discard button group. Open proposals are counted in the save bar ("2 voorstellen open", a link that jumps to the next) and are ignored when saving: the old value is kept.
- **Popup:** clicking a chip opens a popup with its fields, a "Volgt tekst / Vast" choice with a short explanation of both, and remove; clicking the link/pin icon switches the mode and opens it.
- **Ghosts:** removing a chip that had anchor words leaves a dashed, struck-through ghost in the step's add row (visible only while that step is hovered or focused, space always reserved), which restores it; removing a hand-made chip leaves nothing.
- **Hand-made chips:** "+ Ingrediënt / Oven / Timer" in the same add row; they are pinned and have no anchor words.
- **Marks in the text:** yellow underline for following chips, blue for pinned; hovering a chip fills its words.
- **Usage line:** "Gebruikt in stap 1, 5" appears under each ingredient row.
- **Storage:** a migration adds oven temperature, timer minutes and timer name to `steps` and a table of free-text ingredient chips per step; saving a recipe stores them; `getRecipe` returns the full step shape, and the recipe page reads the database again instead of the hardcoded sample recipes, so what is edited is what is shown. Stored chips are tied to their words again on open (equal to the words: following, otherwise pinned).

## Capabilities

### New Capabilities
- `recipe-step-chips`: recognition, anchors, following and pinned chips, proposals, popup, ghosts, hand-made chips, marks, saving and restoring, the save-bar count and the ingredient usage line.

### Modified Capabilities
- `recipe-storage`: steps can hold an oven temperature and a timer, and an ordered list of free-text ingredient chips of their own (added requirements; the existing `step_ingredients` link requirement stays untouched and unused).

## Impact

- New migration `0003_step_chips.sql`; `app/.server/recipes.ts` (`getRecipe` returns steps with chips, `createRecipe` and `updateRecipe` store them), `app/lib/recipes.ts` (`Step`/`Recipe` types now fed by the database), `routes/recipe/route.tsx` (loads from D1; the hardcoded `recipes`/`findRecipe` are no longer used by the recipe page), `seed/dev.sql` (sample recipes with their chips so `pnpm dev` still shows them).
- New `app/lib/anchors.ts`, `stepParsers.ts`, `chips.ts` (pure logic), `shared/recipeEditor/StepChips.tsx`, `ChipPopup.tsx`; `Draft.steps[*]` gains `chips` and `ghosts`; the save bar gets its status content.
- No new dependency.
- Not covered: the home page still lists sample data (board card #4); English recognition (future import); dropping the unused `step_ingredients` table.
