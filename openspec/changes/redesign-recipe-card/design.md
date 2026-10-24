# Design

## Context

Change 2 of 2; depends on `add-recipe-categories` (change 1), which adds `RecipeSummary.categories`. Today `RecipeCard` is one `<Link>` around image, `TileBand` and text; `LikeButton` lives in `routes/recipe/lib/` and posts to `/recepten/:slug/favoriet` (`LikeUpdateRoute`, which stays where it is). `TileBand` already takes `responsive` (tile count follows the width of the nearest `@container`, tiles about 50 to 65px) and `rows`. The visual design was chosen from a mockup (card with photo, seal, tile band with the buttons, then text); the white pill around the buttons and a tinted card body on hover were tried and rejected.

## Goals / Non-Goals

**Goals:**
- A card that shows image, new, title, author, time, like, note and categories, and still fits several per phone screen.
- One like button, shared by the recipe page and the card.

**Non-Goals:**
- See the proposal (note editing, filtering, clickable pills, equal row heights).

## Decisions

- **Card layout.** An `<article>` that is `relative`, `@container`, with the ink border, rounded corners, `shadow-hard` and the existing hover (lift by 0.5 and `shadow-hard-lg`, off under `motion-reduce`). Inside: the image (when there is one) with the `Seal` and the "Nieuw" label over it; a `TileBand responsive`; the text block. The image is two tile heights high and the band one, so that without an image `TileBand rows={3}` has the same height; the image's aspect ratio follows the tile count of the container (3:1, 4:1, 5:1 and so on, steps as in `TileBand`). Alternative: a fixed image height with a band that crops tiles; rejected, tiles must always show whole. Alternative: stretching cards to the row's height; rejected by the owner, it would need tile counts in steps.
- **Buttons on the band.** The like button (44px, from `LikeButton`) and the note icon sit at the bottom right of the band, over the tiles, as individual boxes with their own border and hard shadow (no shared pill). The icon box is a non-interactive `<span role="img" aria-label="Je hebt een notitie">` with the `StickyNote` icon on a yellow fill. The band is at least 50px high, which fits the 44px button; below that width the tile count already steps so tiles stay about 50px or more.
- **Whole card is a link without nesting.** The title is the only `<Link>` (`data-testid="RecipeCard-link"`), with `after:absolute after:inset-0 after:z-1` so it covers the card. The like button and note icon wrap in `relative z-2`. The "Nieuw" label is not inside the link, so the link gets `aria-describedby` pointing at the label's id (`useId`) to announce it. Keyboard focus ring: `has-focus-visible` on the article draws the outline, the link itself has none. Alternative: the whole card as `<a>` with the button inside; invalid HTML and the click would need `preventDefault`.
- **Move `LikeButton` to `shared/components/`** (with its test and the `index.ts` export). It is now used by two routes (STRUCTURE.md). `RecipeView` imports it from `~app/shared/components`. `LikeUpdateRoute` stays in `routes/recipe` because it is a route of the recipe module; the shared button only knows the URL, as before.
- **Hover colour.** Unliked: `hover:bg-yel` (as other buttons in the app). Liked: red mixed a little with ink. Guard with `hover:not-disabled`-style variants only if needed; the press effect (`press`) is unchanged. The recipe page gets the same hover, the spec says so.
- **Keeping a card's state across filtering.** Cards unmount when a search hides them, and the loader's `liked` would be stale on return because the list is not revalidated for search changes. `LikeButton` gets an optional `onSaved` prop, called after the server accepted a change; `HomePage` passes `useRevalidator().revalidate` down through `RecipeCard`, so the list is fetched again after a like. The recipe page does not pass it. Alternative: lifting the liked state into `HomePage`; rejected, more code than one refetch.
- **Data.** `listRecipes` adds `EXISTS (...recipe_likes...) AS liked` and `EXISTS (...recipe_notes...) AS hasNote` for the member in the same query (they are 0/1 and mapped to booleans like `isNew`). `RecipeSummary` gets `liked: boolean` and `hasNote: boolean`.
- **Categories.** The card renders the first two names as pills and, if more, a dashed "+N" pill, from `RecipeSummary.categories` (change 1). Pills are `<span>`s.
- **Test ids and copy.** New ids follow `Component-role` (`RecipeCard-categories`, `RecipeCard-note`, `RecipeCard-more`). All text is Dutch.

## Risks / Trade-offs

- A title that is very long makes a tall card next to a short one in the grid. → Accepted; the cards are not stretched. The title wraps and is not truncated.
- Several tile counts give a different image ratio per width. → Looked at with the screenshot step in tasks at 390px and at a wide screen.
- The leaf over tiles may be hard to see. → It is a white or red box with the ink border and shadow; the first look at the result checks contrast.
- `useRevalidator` refetches the whole list after each like. → The list is small and the call is rare.

## Migration Plan

No data migration. Ships after `add-recipe-categories` is merged.
