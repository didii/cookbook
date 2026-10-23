# Conventions

- Before a change is considered complete, format it with Prettier (which also organizes imports: sorted by path, no blank lines between them) and leave no lint errors. Run the auto-fixers first (`pnpm format:fix`, `pnpm lint:fix`), fix what remains by hand, and confirm with `pnpm format:check` and `pnpm lint:check`.
- Every scenario in `openspec/specs` needs a `describe` named `<capability> › <Scenario title>` (exact `#### Scenario:` title, one scenario per `describe`, one check per `test` inside), or a `test.todo` with that name when it cannot be automated. `pnpm test` fails on a scenario without a test or a test naming an unknown scenario. It only requires tests for `openspec/specs`; while implementing an OpenSpec change, run `pnpm test:spec <change>` (e.g. `pnpm test:spec redesign-recipe-view`) to see which of that change's delta scenarios still lack a test.

- When running the tests yourself, use `pnpm test:ai` (compact `dot` reporter: one character per test, details only for failures) instead of `pnpm test`. CI uses `pnpm test:ci`, which also writes `junit.xml`.

# Communication style

- Always reply in caveman mode (use the `caveman:caveman` skill): short, blunt sentences with small words. Code, commits and PR text stay normal.

# Kanban board

The backlog lives on a Kanban board, a private claude.ai Artifact: https://claude.ai/artifact/WKZqbBbofJm2XhEkwtwYBT. It is not in the repo. Each card is one document in the artifact's database.

**"#N" means a card.** When the user writes `#4`, `item #4` or similar, they mean the card with `num` 4 on this board, never a GitHub issue or a line number. Look the card up before doing anything else; do not guess from the title.

## Reading and changing cards

Use the `ArtifactData` tool (a deferred tool: load it with ToolSearch `select:ArtifactData`) with `url` set to the artifact URL above and `collection` set to `cards`.

- Find a card: action `query` with `where: [["num", "==", 4]]`. List the whole board with action `list`.
- Card fields: `num` (the visible #ID), `title`, `notes` (description, may be empty), `status` (`backlog`, `doing`, `review` or `done`) and `rank` (number; lower is higher up its column).
- Change a card: action `update` with only the changed fields. Every write to an existing document needs `if_version` set to the `version` you just read. The user edits the board in their browser, so re-read if a write reports a version mismatch.
- Move a card: update `status`, and set `rank` so it lands where intended (the rank only orders cards within one column; use a value between its neighbours, or higher than all for the bottom).
- Add a card: action `set`, `doc_id` `c<num>`, with `num` = highest existing `num` + 1 (read the board first), plus `title`, `notes`, `status` and `rank`. Never reuse a number. Keep titles and notes brief.
- Delete a card: action `delete`, and only when the user asks.
- Keep the board up to date without being asked: move a card to `doing` (bottom of that column) when work on it starts, to `review` when its PR is opened. Never move a card to `done`: the user does that when the PR is merged. Match the card by its OpenSpec change or the user's `#N`; if no card clearly matches, ask rather than guess. Do not rewrite the page itself (the artifact's HTML) unless asked.

# Pull requests

- When you finish the last task of an OpenSpec change and nothing is unclear or open to question, push the branch and open a PR for review right away, without asking first. Then move the card to `review`.

@STRUCTURE.md
@TESTING.md
