# Conventions

- Before a change is considered complete, format it with Prettier (which also organizes imports: sorted by path, no blank lines between them) and leave no lint errors. Run the auto-fixers first (`pnpm format:fix`, `pnpm lint:fix`), fix what remains by hand, and confirm with `pnpm format:check` and `pnpm lint:check`.

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
