## 1. Shell

- [x] 1.1 `shared/adminShell.ts`: the class strings of the shell grid (max width, gutters, one column below 64rem, nav column and content column from 64rem), used by the layout and both bars. Verify with `pnpm lint:check` and that `shared/` imports nothing from a route
- [x] 1.2 `routes/admin/lib/AdminNav.tsx` with testids: `nav` "Beheer", items Herkenning, Foto's, Gebruikers (the last for `superadmin` only) as `NavLink`s, the current one styled from `aria-current`, sticky from 64rem and stacked above the content below it, no sub-items. Component test `AdminNav.test.tsx` (describes `admin-nav › The admin pages share a navigation`, `› The navigation lists only the pages a role may use`; the sticky/narrow scenarios through `cssFor`/`mediaFor` or as `test.todo` with the reason)
- [x] 1.3 `routes/admin/AdminLayoutRoute.tsx`: role from the `root` loader, the shell grid, `AdminNav`, and `<main id="main">` with the `Outlet`; `routes/admin/AdminIndexRoute.ts`: loader redirecting to `/beheer/herkenning`. Tests: `AdminLayoutRoute.test.tsx` (nav next to the page content, "Pages keep their own content") and `AdminIndexRoute.test.ts` (describe `admin-nav › The admin area opens on the rules page`)
- [x] 1.4 `routes.ts`: nest the three admin routes (and `:id`) under `route('beheer', …)` with the layout and the index route, inside the site layout. Verify `pnpm typecheck` (generated route types) and that the three admin routes tests still pass

## 2. Pages

- [x] 2.1 `AdminRulesPageRoute.tsx`, `AdminPhotosPageRoute.tsx`, `AdminUsersPageRoute.tsx`: replace the own `<main>` and its width and gutters by a plain container; no change to loaders, actions, `meta` or content. Verify the existing route and component tests pass unchanged (the Gebruikers page keeps its content; no redesign)
- [x] 2.2 `RulesBar.tsx` and the bar of `PhotoList.tsx`: take the container from `shared/adminShell.ts` so a bar starts where the content starts. Component tests per bar that it uses the shell's column (describe `admin-nav › Bars fixed to the bottom start at the content`; the pixel position as `test.todo` with the reason: needs real layout)

## 3. Folding sections

- [x] 3.1 `RulesForm.tsx`: each section (Eenheden, Duur, Graden, Basisproducten) a `<details>` with its `h2` in the `<summary>`, closed at first, open at mount when its list has a message; chevron drawn instead of the marker, hover feedback from `shared/hover.ts`. Component tests in `RulesForm.test.tsx` (describes `parsing-rules › The rules sections fold`: "Sections start closed", "Open a section", "Close a section", "Folding keeps the typed rows", "Refused save opens the section"); the existing tests that type into a list open its section first

## 4. Menu

- [x] 4.1 `SiteMenu.tsx`: one link "Beheer" (to `/beheer`, `admin: true`) replacing "Herkenning", "Foto's" and "Gebruikers"; update `SiteMenu.test.tsx` for the new lists and add "Admin link" (describe `site-menu › Admin link`). Verify `pnpm test:ai` on the file
- [x] 4.2 Specs: archive `add-fridge-search` and `remove-orphaned-photos` before this change; check `pnpm test:spec admin-shell` lists no scenario without a test

## 5. Wrap-up

- [x] 5.1 By hand with `pnpm dev` at 390px and 1000px as admin and superadmin: nav column and stacked nav, current marker (also on a user's detail), `/beheer` redirect, folding on Herkenning, a refused save opening its section, both fixed bars starting at the content; set `docs/design/README.md`'s "Not approved yet" for `admin.html` to approved and list any differences from the mockup
- [x] 5.2 Run `pnpm format:fix`, `pnpm lint:fix`, then `pnpm format:check`, `pnpm lint:check`, `pnpm test:ai` and `pnpm test:spec admin-shell`; all clean
