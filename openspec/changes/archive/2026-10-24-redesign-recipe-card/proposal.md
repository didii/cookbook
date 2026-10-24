# Proposal

## Why

There is more data per recipe now (the member's like and note, soon categories), but the home page card only shows image, title, author and time. A family member browsing should see at a glance what is new, what they liked, what they have a note on and what kind of dish it is, without making the card too big to fit enough on a screen.

## What Changes

Change 2 of 2. **Depends on `add-recipe-categories` (change 1)**: `RecipeSummary.categories` must exist, so that change is applied and merged first.

- Redesign the home page recipe card: photo on top (seal top-right, "Nieuw" label top-left), under it a tile band that carries the like button (always) and a note indicator (only when the member has a note), then title, "van <author> · <time>" and the categories as pills (two at most, then a plain "+N"). One card per row on a phone, as many columns as fit on wider screens, as today.
- A recipe without a photo gets a taller tile band in whole tiles (three high, as tall as photo plus band), so the card keeps its height and the buttons keep their place. No seal there.
- The whole card is still a link to the recipe: the title is the link and stretches over the card; the like button sits above it, not inside it. Pressing the leaf likes or unlikes without opening the recipe.
- Lift the like button out of the recipe page into `shared/components`, reuse it on the card, and give it a hover colour so it looks pressable. The recipe page gets the hover too.
- `listRecipes` also returns `liked` and `hasNote` for the signed-in member on each `RecipeSummary`.
- Look and feel kept from today: tiles, ink border, hard shadow, and the card lift and larger shadow on hover. The card keeps its own height; rows are not equalised.
- Out of scope: opening or editing the note from the card, filtering by category or like, making categories or "+N" clickable, editing categories.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `recipe-browsing`: the card layout (photo, tile band, no-photo variant, whole-card link) and its categories.
- `recipe-like`: the same leaf button on the card, with a hover colour; pressing it on a card does not open the recipe.
- `recipe-note`: the card shows whether the member has a note.
- `recipe-new-marker`: the marker's place on a card without a photo, and how a screen reader hears it.

## Impact

- `routes/home/lib/RecipeCard.tsx` and test (rewritten), `routes/home/HomePageRoute.tsx` and test.
- `routes/recipe/lib/LikeButton.tsx` and test move to `shared/components/` (STRUCTURE.md: used by two routes); `RecipeView.tsx` import changes; `shared/components/index.ts`.
- `shared/recipes.server.ts` (`listRecipes`), `shared/recipe.ts` (`RecipeSummary`: `liked`, `hasNote`), their tests.
- `TileBand` is used as it is (`responsive`, `rows`); no change expected there.
