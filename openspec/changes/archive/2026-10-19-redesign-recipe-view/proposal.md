# Proposal

## Why

The recipe page is built for reading, not for cooking with messy hands. On a phone the ingredients sit above a long list of steps, so you scroll back and forth, and the steps show one "current" step with Vorige/Volgende buttons although people just scroll down. Timers, oven temperatures and the quantity of an ingredient are buried in the step text or in the other list. This redesigns the page around how it is used in the kitchen. Step photos and storing the per-step data come as separate changes, so this one builds the UI against that data as if it were available.

## What Changes

- **Tabs on narrow screens (below 52rem).** Ingrediënten and Bereiding become two tabs in a sticky bar. Both panels stay mounted. The scroll position of each tab is remembered while the bar is stuck: scrolling down the steps, switching to Ingrediënten and back lands on the same place, also after scrolling back up a bit. A tab without a remembered position opens with its heading just under the bar if the other tab has one; before scrolling into either, the tabs swap in place without scrolling. From 52rem up the two columns stay, with the ingredient column sticky.
- **Steps.** All steps are shown at full reading size with a small "Stap N" label (with a done square) above the text, the same on every screen size. The current-step collapsing and the Vorige/Volgende buttons go. Tapping a step dims it as done (visual only, not stored).
- **Quiet chips beside each step label, on all screen sizes.** Three separate kinds of per-step data, each its own entity: an ingredient (quantity and name), an oven temperature (degrees) and a timer (duration in minutes, optional label). Ingredient and oven chips are static and look alike; timers look different and can be operated. Chips are standalone: they do not refer to the recipe's ingredient rows (so "zout" needs no ingredient row).
- **Timers.** Start, countdown, +1 min, +5 min and stop. Several can run at once. A running timer stays in view: on narrow screens in a sticky row under the tabs when its step is out of view, on wide screens in a block above the ingredient list, always with its step number. A timer can be handed to the phone's clock app (Android), per timer or automatically by a setting. A timer that ends is unmistakable (colour, vibration, beep, page title). Timers survive a reload.
- **Cook mode.** On narrow screens only, outside the sticky area: a switch directly above the tabs that keeps the screen awake (Screen Wake Lock). It turns on by itself once cooking has started; one tap on it turns the automatic behaviour off for that recipe.
- **Out of scope.** Storing chips (schema, form, loader), suggesting chips while editing (procedural first; Workers AI deferred, see design), step photos, scaling servings.

## Capabilities

### New Capabilities
- `step-timers`: starting, adjusting and docking per-step timers, and signalling when one ends.
- `cook-mode`: keeping the screen awake while cooking on a narrow screen, automatically and by hand.

### Modified Capabilities
- `recipe-viewing`: tabs with remembered scroll position, whole-list steps with done-dimming, and the per-step chip strip.

## Impact

- `packages/web/app/routes/recipe/` (route, `StepList`, `IngredientList`, new tab, chip, timer and cook-mode components and hooks), `app/app.css` only if a token is missing.
- The recipe page shows hardcoded sample recipes (`lib/recipes.ts`, whose `Recipe` follows `StoredRecipe`'s field names and gives each step its ingredients, an optional oven temperature and an optional timer) instead of the database, until chips can be stored; no schema change, no new dependency.
- The Appeltaart sample holds every kind of chip, so the design can be seen at `/recepten/appeltaart`.
