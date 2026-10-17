## 1. Move server-only modules

- [x] 1.1 `git mv` `app/lib/context.ts`, `identity.ts`, `identity.test.ts` to `app/.server/`; update imports in `app/root.tsx`, `app/routes/recipe/route.tsx`, `app/routes/recipe/route.test.ts`, `workers/handler.ts`, `workers/handler.test.ts`. Also list `app/.server/*.test.ts` explicitly in the test scripts and `scripts/spec-check.ts`, since `**` skips dot directories. Verify: `pnpm test:ai` passes.
- [ ] 1.2 Split `lib/recipes.ts`: move `getRecipe`, `RecipeRow`, `IngredientRow`, `StoredRecipe` and `recipes.test.ts` to `app/.server/recipes.ts`; keep `Recipe`, `recipes`, `findRecipe` in `lib/`. Update imports in `routes/recipe/route.tsx` and `IngredientList.tsx`. Verify: `pnpm test:ai` passes.

## 2. Enforce and document

- [ ] 2.1 Run `pnpm typecheck` and `pnpm build`; confirm the build succeeds and that a temporary top-level import of `~/.server/identity` in a component fails it (then remove the import). Verify: both outcomes observed.
- [ ] 2.2 Update `packages/web/STRUCTURE.md`: add `.server/` to the layout, say `lib/` is for code that runs on both sides, fix the `lib/recipes.ts` test example. Verify: file reads correctly and paths exist.
- [ ] 2.3 Run `pnpm format:fix`, `pnpm lint:fix`, then `pnpm format:check`, `pnpm lint:check`. Verify: all clean.
