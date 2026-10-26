# Design

## Context

`TagInput` (`edit-recipe/lib/`) is a Base UI `Combobox` over `items: string[]` (names; the first item may be the "new tag" offer). The loaders pass `listTags(db)` (`string[]`). `tag-manager` adds `tags.category_id`, `shared/components/Pill.tsx` (variant `category`, yellow) and `listManagedTags(db)` returning `{ name, category, uses }`.

## Decisions

**Loaders pass categories as a map, `tagCategories: Record<string, string>` (tag name → category, only tags that have one), next to the unchanged `tags: string[]`.** `TagInput` keeps its `string[]` items, filtering and tests; it only looks the category up when rendering an option. The map is built in the loaders from `listManagedTags`. Alternative: change `tags` to `{ name, category }[]`: touches filtering, `sameTag` and every test for a render-only need.

**Option layout:** name, then `<Pill variant="category" data-testid="TagInput-category">` pushed to the right (`justify-between`). The name goes in `<span data-testid="TagInput-name">`; the option's `textContent` would now include the category, so existing tests that read option text switch to the name testid. The "Toevoegen" offer renders no pill because a typed new tag is not in the map (`tags.includes(item)` is already how the offer is told apart).

**No new server function.** `listManagedTags` already returns what is needed; its use counts are ignored here. If that proves wasteful, a plain `listTagCategories` can replace it later.

## Risks / Trade-offs

- [Implemented before `tag-manager` lands: `Pill`, `categories` and `listManagedTags` do not exist] → apply after `tag-manager` is merged.
- [A tag renamed or recategorized in the manager while the editor is open] → the editor shows the categories as loaded; the next load is correct.
