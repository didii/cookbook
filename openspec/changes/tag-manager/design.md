# Design

## Context

See proposal.md for why. `add-recipe-tags` (merged) renamed categories to tags (`tags(id, name NOCASE UNIQUE)`, `recipe_tags(recipe_id, tag_id)`) and left the word "category" free for a group a tag belongs to. Editing happens through React Router loaders and actions (see `AdminRulesPageRoute`), server code lives in `shared/*.server.ts`, tests that need SQL use the Miniflare `db` fixture. The mockup `docs/design/tag-manager.html` is the visual and behavioural reference (open in a browser; it works on made-up data).

## Goals / Non-Goals

**Goals:**
- One page where every family member can tidy tags, built as in the mockup.
- Every change is one atomic server action; the UI is the loader data plus local view state.

**Non-Goals:**
- No category management screen: a category exists because a tag has it.
- No URL state for the filters, order or open form, no pagination, no undo (merge and delete ask first).
- No change to how the editor or the home page use tags.

## Decisions

**Schema: `categories(id, name NOCASE UNIQUE CHECK(name <> ''))` and `tags.category_id INTEGER REFERENCES categories(id)`, one migration `0014_tag_categories.sql`.** A tag has at most one category, so a nullable column, not a link table. `ON DELETE SET NULL` is not needed because categories are only deleted when no tag uses them. Unused categories are removed by one statement after every write that can free one: `DELETE FROM categories WHERE id NOT IN (SELECT category_id FROM tags WHERE category_id IS NOT NULL)`, added to the same `db.batch`. Alternative: keep orphans and filter on read: they would pile up as invisible suggestions with no screen to delete them.

**One server module, `shared/tagManagement.server.ts`, one function per user action, each a single `db.batch`:**
- `listManagedTags(db)` returns `{ name, category: string | null, uses }[]` (one query with `LEFT JOIN categories` and a `COUNT` subquery) and `listCategories(db)` returns names. Order is the UI's job (see below), so the loader stays dumb.
- `addTag(db, name)`, `saveTag(db, current, { name, category })`, `mergeTag(db, from, into)`, `deleteTag(db, name)`, `setCategory(db, names, category)`.
- Name rules (trim, collapse inner spaces, 1–100 characters, NOCASE uniqueness against *other* tags) live in one `normalizeName` plus a `findTaken` check. Results are `{ ok: true } | { error: 'empty' | 'tooLong' | 'taken', taken?: string }`, never thrown, so the action can answer the form. The unique index is the backstop for a race.
- Category resolution as for tags: `INSERT OR IGNORE INTO categories (name)`, then `UPDATE tags SET category_id = (SELECT id FROM categories WHERE name = ?)` (NOCASE comparison, so the stored spelling wins). An empty category sets NULL.
- Merge: `UPDATE OR IGNORE recipe_tags SET tag_id = :into WHERE tag_id = :from` moves links, `DELETE FROM recipe_tags WHERE tag_id = :from` drops the ones that would have been duplicates, then `DELETE FROM tags WHERE id = :from`. The target keeps its name and category. Alternative: load, merge in JS and write back: more round trips and a race.
- Delete: `DELETE FROM recipe_tags WHERE tag_id = …` then the tag (the foreign key would refuse a tag with links otherwise).

**Server names tags by name, not id.** The pages and the editor already identify tags by name; `tags.name` is unique, and names stay stable between load and action for one save. A concurrent rename answers "not found", which the UI shows as a reload hint. Alternative: ids in the loader data: more plumbing for no visible gain.

**Route `routes/tags/TagsPageRoute.tsx` at `/tags`, loader (tags + categories) and one `action` with an `intent` field (`add`, `save`, `merge`, `delete`, `bulk`),** like `AdminRulesPageRoute`. No role check: the page is for every member, and family access is already enforced for all routes. Each form posts with `useFetcher` so the open form, filters and typed values survive a failed save (a plain `<Form>` navigation would re-render and drop them); a successful response closes the form and shows a confirmation `<output>`. Errors come back as `data({ error, field }, { status: 400 })`.

**Ordering and filtering are pure client functions in `routes/tags/lib/arrangeTags.ts`:** `arrangeTags(tags, { q, unused, withoutCategory, order })` returns groups `{ category: string | null, tags }[]`: by name a single group that the list renders without heading, by category one group per category and a last one with `category: null`. It reuses `compareTags` from `shared/tags.ts`. The whole list is in the loader (a family cookbook has tens to hundreds of tags), so filtering is instant and needs no request. Alternative: filtering in SQL with search params: needless latency, and the select-all-on-filtered behaviour needs the list on the client anyway.

**Components in `routes/tags/lib/`, one per concern:** `TagList` (rows, headings, select checkboxes), `TagRow`, `TagForm` (fields, saves, owns the `mode` of the actions part: `main | merge | delete`), `TagActions`/`MergeActions`/`DeleteActions` (the part that swaps; the fields live above it in `TagForm` so their state is never unmounted), `AddTagForm`, `Filters` (search, chips, order switch), `SelectionBar`, `CategoryInput`, `TagPicker`. `CategoryInput` and `TagPicker` are Base UI `Combobox` / `Autocomplete` like `TagInput` and `AuthorInput` (keyboard and ARIA for free); `TagPicker`'s only value is a stored tag name other than the current one. They are used by this route only, so they stay in it.

**Sheet vs panel with one element.** The form is rendered under its row. Below 48rem it is `fixed inset-x-0 bottom-0` with the `rise` animation and a backdrop (a button covering the page, closes the form); from `md:` it is `static` in the list flow. Escape is handled on the form, outside click by the backdrop, tapping the row toggles. Scroll locking below 48rem sets `overflow: hidden` on `body` while the sheet is open and restores it on close. Whether it is a sheet or a panel is layout, so it is a `test.todo` (needs a real viewport).

**Shared extractions, no behaviour change:** `shared/components/Pill.tsx` (the card's pill classes, plus a `category` variant with `bg-yel`) used by `RecipeCard` and the manager, and `shared/components/Segmented.tsx` (the radio-based joined control from `FilterBar`, with a legend and options as props) used by `FilterBar` and the manager. Both pages are routes, so by STRUCTURE.md this belongs in `shared/`. `RecipeCard-tag` and `FilterBar-sort*` test ids stay (props pass them through, as in "Forward root element props in components").

**Menu link:** `SiteMenu` gets `{ to: '/tags', label: 'Tags' }` after "Nieuw recept", for every role.

**Select mode** is local state: a `Set` of tag names. "Alles selecteren" uses the arranged (filtered) list. The bar is `fixed` at the bottom like the home page filter bar and respects `useKeyboardOffset` ideas only if the field is hidden by the keyboard on a phone (verify by hand).

## Risks / Trade-offs

- [A concurrent edit by two members: one renames or merges a tag the other has open] → the action answers "not found" or "taken"; the UI shows the message and reloads the list.
- [Large merge or delete batches] → one statement per table, not per recipe; fine at family scale.
- [Removing a category when its last tag leaves means a later "same" category starts fresh] → expected, categories carry no data besides the name.
- [Tag names are keys in the form posts] → a name with odd characters is only ever bound as a parameter and compared NOCASE; the UI escapes it like any text.
- [The sheet's focus handling on phones] → the form moves focus to the name field on open and back to the row on close; verify by hand on a phone-width viewport.

## Migration Plan

`0014_tag_categories.sql` creates `categories` and adds `tags.category_id` (`ALTER TABLE tags ADD COLUMN category_id INTEGER REFERENCES categories(id)`); existing tags get NULL. No data copy. Rollback: drop the column and the table. `dev.sql` gets a few categories on the seeded tags and a tag without a category.
