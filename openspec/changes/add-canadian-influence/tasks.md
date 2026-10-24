# Tasks

## 1. Maple leaf like button

- [x] 1.1 Add `MapleLeaf` to `src/app/shared/icons.tsx` (path from `maple-leaf.svg`, `viewBox="0 0 14 14"`, `currentColor`, outline stroke 0.8 with round joins) and remove `Heart`; verify `pnpm lint:check` finds no unused import
- [x] 1.2 Use `MapleLeaf` in `LikeButton.tsx` at `size-7`, filled when liked; rename the test id to `LikeButton-leaf` and update the doc comment; verify the button keeps its 44px size, labels and `aria-pressed`
- [x] 1.3 Update `LikeButton.test.tsx` and `RecipeView.test.tsx` for the new id and wording (heart becomes leaf); verify `pnpm test:ai` passes for both files and `pnpm test:spec add-canadian-influence` lists no missing `recipe-like` scenario
- [x] 1.4 Delete the loose `maple-leaf.svg` from the repo root; verify `git status` shows only the deletion for that file

## 2. Plaid and header token

- [ ] 2.1 Measure the header's rendered height in the browser (header bar + fret + its margin) and add it as a theme token in `app.css`; make `Header` use it as a minimum height; verify the header looks unchanged and `Header.test.tsx` passes
- [ ] 2.2 Add `src/app/shared/components/Plaid.tsx` (`aria-hidden` absolute layer; props `strength`, `cell`, `className`), export it from `components/index.ts`, and add `Plaid.test.tsx`: draws only from red and ink, takes strength and cell from its props, is `aria-hidden`, adds no colour token; verify the test passes

## 3. Welcome frame

- [ ] 3.1 In `WelcomePageRoute.tsx` wrap the card in the plaid frame (16px padding, 3px ink outline, 22px radius, hard shadow) and make the card `overflow-hidden rounded-xl`; verify in the browser at 320px and desktop that the tile band follows the corners and nothing scrolls sideways
- [ ] 3.2 Add the `plaid-accent` welcome scenarios to `WelcomePageRoute.test.tsx` (`plaid-accent › Card is framed in plaid`, `Frame and card are rounded` through `cssFor`; `Frame on a narrow screen` as `test.todo` with the reason "needs real layout"); verify `pnpm test:ai` passes

## 4. Menu sidebar

- [ ] 4.1 Split the `SiteMenu` panel into a plaid top (header-token height, ink line below, bare white close button at 0.5rem from the left) and the nav body; verify in the browser that the white cross stays legible where ink bands cross it and the header itself shows no plaid
- [ ] 4.2 Add the sidebar scenarios to `SiteMenu.test.tsx` (`plaid-accent › Top of the sidebar is plaid`, `Plaid section is as tall as the header`, `Close button on the plaid`) and the limits to the pages' tests (`plaid-accent › Plaid is hidden from assistive technology`, `No plaid in the header`, `No plaid on recipe pages and cards`); verify `pnpm test:spec add-canadian-influence` reports no scenario without a test

## 5. Finish

- [ ] 5.1 Run `pnpm format:fix`, `pnpm lint:fix`, then `pnpm format:check`, `pnpm lint:check` and `pnpm test:ai`; verify all pass with no lint errors
- [ ] 5.2 Check the like button, welcome page and open menu in the browser on a phone-width viewport against the approved mocks; verify the leaf outline is not too thin and fix the plaid strength or stroke if needed

## Workflow follow-up

- Push the branch and open a PR when the last task is done, then move the board card to `review`.
