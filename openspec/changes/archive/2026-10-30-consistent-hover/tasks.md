# Tasks

## 1. Token and shared controls

- [x] 1.1 Add `--color-hover` to `@theme` in `app.css`, with a test beside it (`app.css.test.ts`); replace the existing color-mix copies with `bg-hover`
- [x] 1.2 `Button`: hover tint via the token, selected/`main` darkens
- [x] 1.3 `Segmented` and `control`: hover tint on unselected segments, darken on the selected one; adapt tests

## 2. Home page

- [x] 2.1 `FilterBar`: filter toggle hover; "Wis filters" covered by `Button`
- [x] 2.2 `MultiSelect`: chip and option hover
- [x] 2.3 `RecipeCard`: remove lift and shadow growth, add `hover:bg-hover`; replace the "hover shadow is the larger one" test with a tint test (`recipe-browsing › Card reacts to the pointer`)
- [x] 2.4 `HomePageRoute`: underline "Voeg het eerste recept toe" on hover

## 3. Recipe page

- [x] 3.1 Tag pills: larger, `min-h-9`, white background, link hover tint (`recipe-viewing` scenarios); child test for `Pill` if it changes
- [x] 3.2 Source link: slight colour change on hover
- [x] 3.3 `TabBar` tabs: hover tint / darken when selected

## 4. Rest of the app

- [x] 4.1 `Header` title link: underline on hover
- [x] 4.2 `SaveBar` "Annuleren", `RecipeEditor` "typeItself", `DeleteUser` access link: apply the text-link and underlined-link rules
- [x] 4.3 Audit `src/app` for clickable elements without hover (`<button`, `<Link`, `<a `, `cursor-pointer`) and fix what is missing

## 5. Finish

- [x] 5.1 Write `hover-feedback` scenario tests (or `test.todo` with reason for what needs a browser); run `pnpm test:spec consistent-hover`
- [x] 5.2 `pnpm format:fix`, `pnpm lint:fix`, `pnpm format:check`, `pnpm lint:check`, `pnpm test:ai`
