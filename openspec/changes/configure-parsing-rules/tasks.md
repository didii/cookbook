# Tasks

## 1. Rules in the database

- [ ] 1.1 Add `packages/web/migrations/0007_settings.sql`: table `settings` (`key` primary key, `value` JSON text with `json_valid` check), no data. Verify with `migrations.test.ts` (a non-JSON value is refused).
- [ ] 1.2 Add `app/lib/rules.ts` (`Rules`, `defaultRules` holding today's words from `ingredients.ts` and `stepParsers.ts`) and `app/.server/rules.ts`: `getRules(db)` (defaults when the row is missing or unreadable, missing fields filled from defaults), `saveRules(db, fields)` (validate, then upsert the `parsing-rules` row) and `resetRules(db)` (delete the row). Verify with `rules.test.ts` tests `parsing-rules › Default rules`, `parsing-rules › Unreadable saved rules`, `parsing-rules › Restore defaults`, `parsing-rules › Add a unit`, `parsing-rules › Remove a word`, `parsing-rules › Spoken duration`, `parsing-rules › Spoken duration without minutes`, `parsing-rules › Empty list`, `parsing-rules › Word in two lists`, `parsing-rules › Saving the unchanged defaults succeeds`.

## 2. Parsers take rules

- [ ] 2.1 Change `parseIngredient`, `findTimer` and `findOven` to take `rules` and build their patterns from escaped words (longest first, cached per `rules` object); remove the fixed `units` and the TODOs. Verify with `ingredients.test.ts` and `stepParsers.test.ts` (existing tests pass `defaultRules`) and `parsing-rules › Words are not regular expressions`.
- [ ] 2.2 Add `rules` to the chip `Context` and pass it through `chips.ts`, `draft.ts`, `scale.ts` (`scaleBody`), `recipeValidation.ts` and `IngredientItem.tsx`. Verify with the existing chip, draft and scale tests, plus `parsing-rules › New unit is recognised`, `parsing-rules › New minute word makes a timer`, `parsing-rules › New spoken duration makes a timer`, `parsing-rules › Removed word is not recognised`, `parsing-rules › Scaling uses the stored units`.
- [ ] 2.3 Return `rules` from the root loader and hand them to the places that parse: `routes/edit-recipe/route.tsx` and `routes/new-recipe/route.tsx` (their actions call `readIngredients` and `readSteps` in `recipeValidation.ts`, which use `getRules`), `routes/recipe` (`scaleBody` in `RecipePage.tsx`) and `RecipeEditor.tsx` (the client reads root data). Verify with `parsing-rules › Saved change applies at once` (loader-level test).

## 3. Admin only

- [ ] 3.1 Add `requireAdmin(db, email)` to `.server/users.ts` (403 unless `admin` or `superadmin`). Verify with `users.test.ts` unit tests.
- [ ] 3.2 Add route `beheer/herkenning` (`routes/admin-rules/route.tsx`) with a loader and action that call `requireAdmin` first, and a form with five textareas, the error messages and the restore button; register it in `routes.ts`. Verify with `parsing-rules › User opens the page`, `parsing-rules › User posts a change`, `parsing-rules › Admin opens the page`, `parsing-rules › Superadmin opens the page`, `parsing-rules › Non-admin cannot restore defaults`.
- [ ] 3.3 Root loader does one `getUser` and returns `role`. `Layout` passes `role` to `Header`, which passes it to `SiteMenu` (one `role` prop) which adds "Herkenning" for admin and superadmin; update `Header.test.tsx`. Verify with `SiteMenu.test.tsx` tests `parsing-rules › Admin sees the link`, `parsing-rules › Superadmin sees the link`, `parsing-rules › User does not see the link`, and `site-menu › Menu lists the links for a superadmin`.

## 4. Finish

- [ ] 4.1 Run `pnpm test:spec configure-parsing-rules` (no scenario without a test), then `pnpm format:fix`, `pnpm lint:fix`, `pnpm format:check`, `pnpm lint:check`, `pnpm typecheck` and `pnpm test:ai`; all pass.
