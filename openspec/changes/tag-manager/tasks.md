# Tasks

Change 2 of 2 (after `add-recipe-tags`). Reference: `docs/design/tag-manager.html`. Verify each task with the type check and `pnpm test:ai`; `pnpm test:spec tag-manager` lists the delta scenarios still without a test.

## 1. Database

- [x] 1.1 Add migration `0014_tag_categories.sql` (`categories` with a unique NOCASE non-empty name, nullable `tags.category_id` referencing it); test in `migrations.test.ts` the "recipe-storage › Tag with a category", "Tag without a category", "Category name is unique", "Category is shared" and "Tag needs an existing category" scenarios, and that tags written before the migration survive it with no category
- [x] 1.2 Add categories to `src/db/seed/dev.sql` (some tags with one, some without); verify `seed/dev.test.ts` passes

## 2. Server

- [x] 2.1 Add `shared/tagManagement.server.ts` with `listManagedTags` (name, category, uses) and `listCategories` (alphabetical via `sortTags`); test "recipe-storage › Categories are listed alphabetically" and the list data behind "tag-management › Row shows tag, category and count", "Unused tag" in `tagManagement.server.test.ts`
- [x] 2.2 Add `addTag` and the shared name rules (trim, collapse spaces, 1–100 characters, taken in any letter case); test "A tag is added", "A taken name is refused", "An empty name is refused", "A too long name is refused"
- [x] 2.3 Add `saveTag` (rename and category in one batch, category resolved to the stored spelling or created, empty removes, unused categories removed, a taken name refuses everything); test "Name and category in one save", "Own name in another letter case", "A taken name refuses the whole save", "Empty or too long name", "A new category is created", "Stored spelling is used for a category", "Empty category removes it", "Unused category disappears" and "recipe-storage › Unused category is removed"
- [x] 2.4 Add `mergeTag` and `deleteTag`; test "Merge moves the recipes", "Merge keeps the chosen tag as it is", "Tag is deleted", and that deleting or merging frees an unused category
- [x] 2.5 Add `setCategory` for many tags; test "Setting a category on the selection" and "Empty category on the selection"

## 3. Shared pieces

- [x] 3.1 Extract the card's pill into `shared/components/Pill.tsx` with a `category` variant (yellow); use it in `RecipeCard` (test ids unchanged); test "Category pill is yellow" with `cssFor` and "Recipe card uses the shared pill"
- [x] 3.2 Extract the joined radio control from `FilterBar` into `shared/components/Segmented.tsx` (legend, options, selected value, pass-through test ids); `FilterBar` uses it and its tests still pass untouched
- [x] 3.3 Add the "Tags" link after "Nieuw recept" in `SiteMenu`; update `SiteMenu.test.tsx` to the "site-menu" scenarios "Menu lists the links", "… for an admin", "… for a superadmin" and add "Tags link"

## 4. Route and arrangement

- [x] 4.1 Add `routes/tags/lib/arrangeTags.ts` (filters on name, unused and without category; order by name or by category with tags without a category last) and unit-test "Sorted by name", "Sorted by category", "Name filter", "Unused filter", "Without category filter", "Filters combine"
- [x] 4.2 Add `TagsPageRoute.tsx` (loader, `meta`, one `action` with the intents `add`, `save`, `merge`, `delete`, `bulk` answering errors as 400 data), register `/tags` in `routes.ts`, and route-test the loader and each intent against the in-memory D1 ("A member opens the page", "A taken name is refused" through the action)

## 5. Page

- [ ] 5.1 Build `TagList`/`TagRow` and `Filters` (search, "Ongebruikt" and "Zonder categorie" chips, `Segmented` order switch, count line, group headings, empty and no-match states, add field); component-test "Row shows tag, category and count", "Tag without a category", "Count line", "No tags yet", "Group heading shows the count", "Category order has no category pill on rows", "Nothing matches", "Switch looks like the home page sort"
- [ ] 5.2 Build `TagForm` with `CategoryInput` (Base UI combobox over the stored categories, free text creates) and the single "Opslaan"; component-test "Row opens the form", "Row closes the form", "Escape closes the form", "One form at a time", "Category suggestions", "Merge offered for a taken name" (field half) and the message at the name for a taken name; mark "Sheet on a phone, panel on a wide screen" and "Outside click closes the sheet" `test.todo` with the reason (needs a real viewport and pointer)
- [ ] 5.3 Build the swapping actions part: `TagActions`, `MergeActions` (`TagPicker`, preview with tag pills, disabled until a stored other tag is chosen, "Annuleer") and `DeleteActions` (count text, "Verwijder tag", "Annuleer"), with the fields kept mounted above; component-test "Actions of the form", "Merge replaces only the actions", "Merge needs a chosen tag", "Own tag is not offered", "Merge preview", "Merge is cancelled", "Confirmation names the recipes", "Confirmation for an unused tag", "Delete is cancelled"
- [ ] 5.4 Build select mode (`SelectionBar`: count, "Alles selecteren" on the filtered list, "Niets", category field, "Instellen"); component-test "Select mode shows checkboxes", "Row toggles in select mode", "Select all follows the filters", "Setting needs a selection", "Leaving select mode clears the selection"
- [ ] 5.5 Check by hand against `docs/design/tag-manager.html` at 390px and 1280px: sheet and panel, focus moves to the name field on open and back to the row on close, the sheet and the selection bar are not hidden by the phone keyboard

## 6. Wrap-up

- [ ] 6.1 Run `pnpm format:fix`, `pnpm lint:fix`, then `pnpm format:check`, `pnpm lint:check`, `pnpm test:ai` and `pnpm test:spec tag-manager`; all clean
