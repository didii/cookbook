# Design

## Context

See proposal.md for motivation. Visual reference: the approved mockup `docs/design/koelkast.html` and its section in `docs/design/README.md`; follow it for layout, sizes and copy.

- Home loads all recipes once (`listRecipes`) and filters in the browser (`filterRecipes`); the address holds the filters and `shouldRevalidate` skips the loader for search-only changes. The fridge page works the same way.
- `RecipeSummary` has no ingredients. Ingredients are in the `ingredients` table (`name`, `position`) per recipe.
- Parsing rules are stored as one JSON value in `settings` (key `parsing-rules`); no row means "use the defaults in code", an unreadable value falls back to the defaults. Admin pages call `requireAdmin` in loader and action.
- `RecipeCard` lives in `routes/home/lib/`; STRUCTURE.md says a file a second route needs moves to `shared/`.
- `site-menu` is also modified by the in-flight change `add-home-menu-item` (adds "Home"). This delta is written on top of that one, so that change must be archived first.

## Goals / Non-Goals

**Goals:**
- One pure function module for matching and ranking, tested on its own, so components only render its result.
- The home page stays as it is.

**Non-Goals:**
- Plurals, compounds or synonyms in matching.
- Remembering the lists between visits.
- Changing home's hover behaviour.
- Server-side filtering.

## Decisions

**Route and state.** New route `routes/fridge/FridgePageRoute.tsx` at `koelkast`, inside the layout. The lists and sort are read from the address (`heb`, `zonder`, `sort`) and written with `replace: true`, like home. Filtering runs in the browser on loader data. Alternative: component state only. Rejected: a reload would lose the lists and the spec asks for shareable addresses.

**Loader data.** The loader returns the recipe summaries (`listRecipes`), the ingredient names per slug (new `listIngredientNames(db)` in `recipes.server.ts`: one query ordered by recipe and position) and the staples (`getStaples`). Alternative: add `ingredients` to `RecipeSummary`. Rejected: home would then carry every ingredient for nothing.

**Matching (`routes/fridge/lib/matchIngredients.ts`, pure).**
- `words(text)`: fold (NFD, drop marks, lowercase), split on anything that is not a letter or digit.
- `matches(entry, name)`: the entry's words occur as a contiguous run in the name's words.
- `rankRecipes(...)` returns, per recipe: `used` (entries matched), `unused` (entries not matched), `missing` (ingredient names matched by no entry and no staple, in recipe order, each once). Recipes with a "zonder" match are dropped; with "heb" entries, recipes with no match are dropped; ordering as in `filterRecipes` (stable sort by match count over the chosen order). The count N/M is `used.length` / entries.
- Dedupe of entries uses the same fold (`sameName` from home's `filterRecipes.ts` is not imported: routes may not import each other; the fold helper is small and lives in the fridge module, or in `shared/` if home's filtering is later moved).
- Alternative: substring matching. Rejected by the user: "ui" would match "pruimen". Known cost: plurals and compounds miss.

**Lists and address helpers.** `parseLists(params)` and `listParams(lists)` in `routes/fridge/lib/`, mirroring `parseFilters`/`filterParams`. Adding a word to one list removes it from the other inside one function (`addEntry(lists, kind, text)`), so the component cannot forget it.

**Components** (each with Props above and its own test, per TESTING.md): `IngredientList` (label, input, button, chips; used twice with a `kind` prop that picks the button and colour; only the fridge page uses it, so it lives in `routes/fridge/lib/`), `FridgeCard` (wraps the shared `RecipeCard` and the plain part), `MissingIngredients` (rows, +/−, "+N meer"), `UnusedEntries` (struck-through chips with sr-only text). `FridgeCard` puts the count inside the part that opens the recipe by passing it to `RecipeCard` as children-after-tags (a `footer` prop); the plain part is rendered outside the card's link area, below a separator, in the same `article`. The title link stays stretched over the card's top part only: the plain part sits in a `relative` element after the link's containing block, as in the mockup (`.open` vs `.fridge`).

**RecipeCard move.** `routes/home/lib/RecipeCard.tsx` and its test move to `shared/components/RecipeCard.tsx` and are exported from `components/index.ts`; home imports it from there. It gains one optional `footer` (shown under the tags, inside the link area) and `children` (rendered below a separator, outside it). Behaviour for home is unchanged. Home's hover raise stays; the fridge page overrides it through a `className` that removes the translate and keeps the shadow, and adds the tint. Alternative: copy the card. Rejected: two cards to keep in step.

**Staples.** Stored in `settings` under key `staples` as a JSON array of strings, with the defaults in code (`shared/staples.ts`), exactly like parsing rules; a saved empty array means no staples, no row means the defaults. No migration. Alternative: a new table. Not chosen: the list is only ever replaced as a whole, which is what `settings` is for, and the defaults-in-code fallback is already proven there. `shared/staples.server.ts`: `getStaples`, `readStaples` (validation), `saveStaples`, `resetStaples`.

**Staples on the rules page.** The rules page ("Herkenning") gets a fourth `Section` "Basisproducten" in `RulesForm` after "Graden": a `RuleList` of staples, edited and saved like the other lists. `RulesRows` gets a `staples: string[]`; the existing action reads it, validates it with `readStaples` (letters and spaces, at most 40 characters, at most 100 rows, repeats by fold dropped, empty allowed), and refuses the whole save when any list is faulty, so a refused save stores no staples either. Errors use the existing `RulesErrors` shape under `staples`. The `reset` intent also calls `resetStaples`. `requireAdmin` already guards loader and action. The page will be redesigned later; this change adds one more list to it and nothing else. No new route, no menu link. Alternative: a separate page. Rejected for now by the user.

**Hover.** Tint is ink at 8% like `Button`. On the fridge page only; no change to shared styles that home uses beyond the optional `className`.

## Risks / Trade-offs

- [Whole-word matching misses "eieren" for "ei", "kipfilet" for "kip"] → Documented in the proposal; the missing list makes the miss visible and the user can type the other form. A later change can add stemming.
- [Adding "+" for an ingredient adds its full name, e.g. "gekookte kip", which matches fewer recipes than "kip"] → Accepted; the user can remove the chip and type the short word.
- [Ingredient names are free text, so "rijst (gekookt)" has the word "gekookt"] → Words are split on non-letters, so "rijst" still matches; the extra word only matters if typed.
- [Staples share the rules page's one save: a fault in another list blocks a staple change] → Matches how the page already works for its other lists.
- [`site-menu` delta overlaps `add-home-menu-item`] → Archive that change first (it is complete); otherwise the delta's text for "Home" is out of date.
- [Card has two zones with different click behaviour] → Covered by scenarios "The card opens the recipe" and "Buttons do not open the recipe".

## Open Questions

- None.
