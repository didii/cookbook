# Design

## Context

`RecipeView` shows `LikeButton` and a "Bewerk" `Link` (testid `RecipeView-edit`, `state={{ fresh: true }}` so the editor discards a draft) in the top row. `lib/` is already grouped by feature (`cook/`, `notes/`, `scale/`, `tabs/`, `timers/`). See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**
- One menu button with the three items, disabled where the feature does not exist yet.
- Later changes enable an item by replacing its disabled button with a working one.

**Non-Goals:**
- No arrow-key navigation, typeahead or other menu-widget behaviour.
- No mockup: the button looks like the other icon buttons on the page.

## Decisions

- **New sub-module `lib/actions/`** with `RecipeActionsMenu.tsx` (exports one component) and the three-dots icon beside it. Only the recipe page uses it, so it is not in `shared/`.
- **Disclosure, not an ARIA menu.** A button with `aria-expanded` and `aria-controls` toggles a panel of plain links and buttons. A `role="menu"` would promise arrow-key handling that is not built; Tab order through the items is enough. Alternative: the native `popover` attribute, rejected because happy-dom support is uncertain and the component test would not exercise it.
- **Closing** is state in the component: Escape and a pointer-down outside close it and return focus to the button on Escape; choosing an item closes it.
- **Disabled items** are `<button disabled>`: dimmed, not focusable, not operable, no `onClick`. Native disabled needs no extra ARIA.
- **"Bewerk" stays a `Link`** with `state={{ fresh: true }}`; only its place changes. Its testid becomes `RecipeActionsMenu-edit`.
- **Hover:** items use `hoverTint` from `shared/hover.ts`; the icon button uses the same helper as the like button.

## Risks / Trade-offs

- [Edit is one tap further away] → accepted: it is the price of room for more actions.
- [Panel overlapped by the sticky tab bar further down the page] → the panel opens from the top row, above the stack, and gets a higher `z-index`.
