# Design

## Context

`RowToolbar` is shared by ingredients and steps and renders three buttons with a roving tabindex over `[up, down, delete]`. See proposal.md.

## Decisions

- **Optional `onInsert` prop on `RowToolbar`**: when given, a fourth button is placed first and joins the roving tab stop and arrow keys. Ingredients do not pass it, so they are unchanged. Alternative, a separate button outside the toolbar, was rejected: the requirement is one toolbar and one Tab stop.
- **Insert = `addStep(draft, at)`** from `lib/draft.ts`, at the step's index. Focus goes to the new step with the list's existing after-render focus request. A pending undo offer is dismissed, like for other edits.
- **Free step**: inserting above a filled step leaves the free step at the end; the button on the free step is `disabled`.
- Icon: a plus beside the existing `Up`, `Down` and `Trash` icons in `shared/icons`.

## Risks / Trade-offs

- `RowToolbar`'s button logic (`enabled`, `stop`) is hard-coded to three slots → derive the slot list from props.
