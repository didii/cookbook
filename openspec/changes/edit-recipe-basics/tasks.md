# Tasks

## 1. Draft and dirty check

- [x] 1.1 Add `app/lib/draft.ts` (`Draft`, `isDirty`, a helper that builds the starting draft from stored values or empty) with `draft.test.ts`; verify the tests pass for: equal drafts, a changed field, whitespace-only difference (not dirty), and reverting a change (not dirty again).

## 2. The editor shell

- [ ] 2.1 Build `shared/recipeEditor/RecipeEditor.tsx` with the grid layout, the large inline title, intro, and the rail with author, servings and time (the existing image field stays in the rail until `edit-recipe-picture`), keeping the visible asterisks, the legend line, the hidden `h1`, error text tied to fields and focus on the first error; verify in `pnpm dev` at 360px and at desktop width, and with `test.todo`s (a browser is needed) named `recipe-form › Wide screen layout` and `recipe-form › Narrow screen layout`.
- [ ] 2.2 Build `SaveBar.tsx` (status slot, Herstel, Annuleren, Opslaan, busy state) and wire it into the editor; verify with `test.todo`s named `recipe-form › Save bar stays in view`, `recipe-form › Save is busy while storing` and `recipe-form › Cancel leaves without storing` (each with the reason on the line above) and in `pnpm dev`, including on a phone with the keyboard open.
- [ ] 2.3 Implement Herstel with the inline question (`Ja`/`Nee`, focus on `Nee`, `Esc` declines) and the "Niet opgeslagen" status; verify with tests on the pure state logic named `recipe-form › Reset hidden without changes`, `recipe-form › Reset restores the starting values` and `recipe-form › Unsaved indicator`, and `test.todo`s named `recipe-form › Reset asks first` and `recipe-form › Reset can be declined`.
- [ ] 2.4 Add the leave guard (`useBlocker` plus `beforeunload`, off while submitting and while clean); verify with `test.todo`s named `recipe-form › Leaving with unsaved changes asks first` and `recipe-form › Leaving without changes does not ask`, and by hand in `pnpm dev` (link click, reload, close tab, after saving).

## 3. Routes

- [ ] 3.1 Switch `routes/new-recipe` and `routes/edit-recipe` to `RecipeEditor` (props: values, errors, authors, tile, cancelTo, heading), delete `RecipeForm.tsx`, change the button label to "Opslaan"; verify that the existing `recipe-creation` and `recipe-editing` route tests still pass, and add a test named `recipe-form › Nothing stored before saving` (loading the editor and changing state does not call the action; the route test asserts the database is unchanged).
- [ ] 3.2 Update the wording of the `recipe-editing` tests for the modified requirement (scenario titles are unchanged; `recipe-editing › Optional field emptied` covers servings, time and intro); verify `pnpm test:spec edit-recipe-basics` reports every delta scenario covered or `test.todo`.

## 4. Wrap-up

- [ ] 4.1 Run `pnpm format:fix`, `pnpm lint:fix`, `pnpm format:check`, `pnpm lint:check`, `pnpm typecheck` and `pnpm test:ai`; verify all pass, then create and edit a recipe end to end in `pnpm dev` at 360px and desktop width.
