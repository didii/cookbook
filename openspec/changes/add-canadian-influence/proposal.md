# Proposal

## Why

The site already carries Belgian (comic outlines, hard shadows), Chinese (seals, key-fret) and Portuguese (tile bands) influences. Part of the family has a Canadian link, so Canada becomes a fourth layer, small and kept away from the text people read while cooking.

## What Changes

- The like button on the recipe page shows a maple leaf instead of a heart. Not liked: outlined leaf on white. Liked: filled white leaf on the red button. Behaviour, size, labels and state stay as they are.
- The welcome screen's card gets a buffalo-plaid frame (red ground, ink bands crossing both ways), with rounded corners on the frame and on the card inside. The card clips its tile band to the rounded corners.
- The top part of the site menu sidebar is plaid, as tall as the header with its fret, with an ink line below. The rest of the sidebar stays solid red. The close button stays a bare white cross, now on the plaid.
- The header gets no plaid. The recipe page, cards and home grid get none either.
- Plaid is one shared, decorative, pure-CSS pattern with no image and no new colour token.
- The test id `LikeButton-heart` becomes `LikeButton-leaf`. The loose `maple-leaf.svg` in the repo root is removed once its path lives in `shared/icons.tsx`.

Out of scope: blanket stripes, syrup drips, sash or leaf rows, any flag, Indigenous art, new copy, any Canadian story.

## Capabilities

### New Capabilities
- `plaid-accent`: where the Canadian plaid appears (welcome card frame, top of the menu sidebar), where it does not (header, recipe page, cards), and that it is decorative.

### Modified Capabilities
- `recipe-like`: the like button is a maple leaf instead of a heart. Appearance wording changes; behaviour does not.

## Impact

- `src/app/shared/icons.tsx` (new `MapleLeaf`, `Heart` removed), `src/app/routes/recipe/lib/LikeButton.tsx` and its test, `RecipeView.test.tsx`.
- `src/app/shared/components/SiteMenu.tsx` and its test.
- `src/app/routes/welcome/WelcomePageRoute.tsx` and its test.
- A shared plaid component or class in `src/app/shared/` and `app.css` tokens if needed (no new colour).
- `openspec/specs/recipe-like` (delta), new `openspec/specs/plaid-accent`.
- Removes `maple-leaf.svg` from the repo root. No dependency, storage or API change.
