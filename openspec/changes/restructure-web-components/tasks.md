## 1. Foundations

- [x] 1.1 Add `tailwind-merge` to `packages/web` and create `app/shared/cn.ts` exporting `cn`. Verify: `npm run typecheck` passes and `cn("text-sm", "text-lg")` returns `"text-lg"` (quick node check).
- [x] 1.2 Move `context.ts`, `identity.ts`, `recipes.ts` to `app/lib/`; extract `tileFor` into `app/lib/tile.ts`. Update imports in `workers/app.ts`, `test/identity.test.ts` and app code (relative imports in `lib/identity.ts`). Verify: `npm test` and `npm run typecheck` pass.
- [x] 1.3 Add design tokens (colors, hard shadows) to `@theme` in `app.css`. Verify: `npm run build` succeeds.

## 2. Shared components

- [x] 2.1 Create `shared/Button.tsx` (default/main variants, `disabled:` and active styling, `className` override via `cn`). Verify: renders identically to `.btn`/`.btn-main` on the recipe page.
- [x] 2.2 Move `TileDefs`, `TileBand` into `shared/` as Tailwind-styled components; delete `components.tsx`. Verify: tile bands render on home and recipe.
- [x] 2.3 Extract `SkipLink` and `Header` from `root.tsx` into `shared/`, using utilities (including `focus-visible:` white outline in the header). Verify: skip link appears on focus; header looks like the screenshots.

## 3. Home route

- [x] 3.1 Create `routes/home/route.tsx` (drop the unused `meta` argument) and `routes/home/RecipeCard.tsx` with utilities; update `routes.ts`. Verify: home matches `.impeccable/review/home-d.png` and `home-m.png`.

## 4. Recipe route

- [x] 4.1 Create `routes/recipe/route.tsx` (loader, meta, composition) with page header/meta/hero in utilities. Verify: page matches `rec-d.png` and `rec-m.png`.
- [x] 4.2 Extract `IngredientList.tsx` (owns `done` state; style via `has-[:checked]`, no `.done` class) and `StepList.tsx` (owns `current` state; style via `aria-current`) and `Wave.tsx`. Verify: ticking an ingredient strikes it through; stepping with Vorige/Volgende highlights the current step; buttons disable at the ends.

## 5. Cleanup and docs

- [x] 5.1 Remove all component classes from `app.css`, leaving `@import`, `@theme`, base `html`/`body`, `::selection`, `:focus-visible`. Verify: `grep -E "^\.[a-z]" app/app.css` returns nothing and pages still look unchanged.
- [x] 5.2 Switch cross-folder imports in `app/` to the `~/` alias. Verify: `grep -rn '"\.\./' packages/web/app` shows no cross-folder relative imports (except `lib/identity.ts` relatives).
- [x] 5.3 Write a succinct `packages/web/STRUCTURE.md` of recommendations (not rules): layout, promotion to `shared/`, route module vs component file, import style, naming, styling with `cn`/ARIA state, and a note that deviations are fine when justified. Verify: file exists, fits on about one screen, and uses "prefer/usually" wording rather than "must/shall".
- [x] 5.4 Create `packages/web/CLAUDE.md` that imports it (`@STRUCTURE.md`) so the guidance is always in context when working in the package. Verify: file exists and the import path resolves.
- [x] 5.5 Final check: `npm run typecheck`, `npm test`, `npm run build`, and visually compare home and recipe (desktop and mobile) against `.impeccable/review/` screenshots.
