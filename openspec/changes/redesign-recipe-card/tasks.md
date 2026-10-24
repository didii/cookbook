# Tasks

Change 2 of 2. Precondition: `add-recipe-categories` is merged. Verify each task with the type check and `pnpm test:ai`; `pnpm test:spec redesign-recipe-card` lists the delta scenarios still without a test.

## 1. Data

- [x] 1.1 Add `liked` and `hasNote` to `RecipeSummary` and return them from `listRecipes` for the member; test "Card of a liked recipe", "Card of a recipe not liked", "Another member's like on a card", "Recipe with a note", "Recipe without a note" and "Another member's note on a card" at data level in `recipes.server.test.ts`, and update fixtures so the type check passes

## 2. Shared like button

- [x] 2.1 Move `LikeButton` and its test to `shared/components/`, export it from `index.ts`, import it in `RecipeView.tsx`; keep the recipe-like tests passing unchanged
- [x] 2.2 Add the hover colour (yellow unliked, darker red liked) and the optional `onSaved` prop (called after the request succeeded); test "Leaf reacts to the pointer" (declaration exists, `cssFor`) and `onSaved` called on success, not on failure, in `LikeButton.test.tsx`

## 3. The card

- [ ] 3.1 Rewrite `RecipeCard.tsx`: article with image, seal, "Nieuw" label, `TileBand responsive` (`rows={3}` without image), like button and note icon on the band, title link stretched over the card, author and time, categories as pills with "+N"; test the scenarios of `recipe-browsing` (image/band/text order, seal, no image, the whole card opens the recipe, `test.todo` for same height, two cards on a phone and the hover), "Pills are not interactive", the category scenarios, "Leaf is not inside the link", "Note icon only indicates" and the two "Marker on a card" scenarios in `RecipeCard.test.tsx`; remove the tests of the old image ratio
- [ ] 3.2 Pass `liked`, `hasNote` and `categories` to the card in `HomePageRoute.tsx` and revalidate after a like (`onSaved`); test "Liking from a card" and "A like from a card is kept" in `HomePageRoute.test.tsx` and update the other tests for the new fixtures

## 4. Wrap-up

- [ ] 4.1 Run `pnpm format:fix`, `pnpm lint:fix`, then `pnpm format:check`, `pnpm lint:check` and `pnpm test:ai`; all clean
- [ ] 4.2 Start the app with the dev seed, look at the home page at 390px and at a wide screen (cards with and without image, liked and not, with a note, new), fix what is wrong, and run `impeccable detect` once on the changed files
