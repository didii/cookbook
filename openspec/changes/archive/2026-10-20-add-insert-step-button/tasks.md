# Tasks

## 1. Toolbar

- [x] 1.1 Add a plus icon and an optional `onInsert` button to `RowToolbar` (first slot, in the Tab stop and arrow-key order, inert when the toolbar is `disabled`). Verify with a test that an ingredient toolbar is unchanged and a step toolbar has four buttons in one tab stop.

## 2. Steps

- [x] 2.1 Wire `StepEditor`/`StepList` to insert an empty step above and focus it, using `addStep(draft, at)`. Verify in the running app and with a `lib/draft.test.ts` case.
- [x] 2.2 Update the toolbar in `docs/design/recipe-editor.html`. Verify by opening it.

## 3. Spec tests

- [x] 3.1 Add tests named `recipe-step-editing › <Scenario title>` for each new scenario. Verify with `pnpm test:spec add-insert-step-button` and `pnpm test:ai`.
- [x] 3.2 Run `pnpm format:fix` and `pnpm lint:fix`, then confirm `pnpm format:check` and `pnpm lint:check`.
