# Tasks

## 1. Menu component

- [x] 1.1 Add `lib/actions/RecipeActionsMenu.tsx` with its three-dots icon: toggle button "Meer acties" (`aria-expanded`, `aria-controls`), panel with "Bewerk" (`Link` to `/recepten/<slug>/bewerken`, `state={{ fresh: true }}`), disabled "Kopieer" and "Deel"; verify `RecipeActionsMenu.test.tsx` covers "The button tells whether the menu is open", "The menu lists its items", "Bewerk links to the edit form", "Kopieer is disabled" and "Deel is disabled", with `data-testid="RecipeActionsMenu-…"` ids
- [x] 1.2 Close on Escape (focus back to the button), on a pointer-down outside and on choosing an item; verify "Escape closes the menu", "A click outside closes the menu" and "Choosing an item closes the menu" in the same test file
- [x] 1.3 Give the items `hoverTint` and the button the like button's hover helper; verify the hover tests still pass and check the panel at 390px and 1280px in the browser

## 2. Recipe page

- [x] 2.1 Replace the "Bewerk" link in `RecipeView` by `RecipeActionsMenu` after `LikeButton`; update `RecipeView.test.tsx` (the order test compares the like button and the menu button, the href test moves to `RecipeActionsMenu.test.tsx`) and add a test for "The button is shown instead of the edit link"
- [ ] 2.2 Run `pnpm format:fix`, `pnpm lint:fix`, `pnpm test:spec recipe-actions-menu`, `pnpm test:ai`, `pnpm format:check` and `pnpm lint:check`; verify all pass and every delta scenario has a test or a `test.todo`
