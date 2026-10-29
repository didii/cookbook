# Proposal

## Why

Tags are made up on the fly in the recipe editor (`add-recipe-tags`), so typos and near-duplicates pile up ("Soep", "Soepen"), unused tags stay forever and nothing groups them. The family needs one place to tidy the tag list. Board card #47; change 2 of 2 after `add-recipe-tags`, which left the tag manager and categories for this change.

## What Changes

- A new page "Tags" (`/tags`), open to every family member, linked from the site menu. Design reference: `docs/design/tag-manager.html`.
- The page lists all tags, each as the recipe-card pill with its category (a yellow pill of the same shape) and the number of recipes that have it.
- Order: "Volgorde" switch between Naam (alphabetical) and Categorie (grouped under category headings, categories alphabetical, tags without one last). The switch looks like the sort on the home page.
- Filters: name search, a chip "Ongebruikt" (tags on 0 recipes) and a chip "Zonder categorie"; they combine.
- Add a tag; a name that exists in any letter case is refused.
- A tapped row opens one form (a bottom sheet below 48rem, unfolding under the row from 48rem; no close button) with the name and the category (autocomplete over the existing categories, free text creates one, empty removes it) and a single "Opslaan". A taken name refuses the whole save and offers to merge.
- "Samenvoegen met…" and "Verwijderen" replace only the actions part of the form, so typed values stay. Merge shows what happens (recipes that have both keep the target once); delete says how many recipes lose the tag.
- "Selecteer" mode with checkboxes and a bottom bar to set one category on all selected tags; "Alles selecteren" takes the filtered result.
- New data: a `categories` table and `tags.category_id` (a tag has at most one optional category), as announced in the `add-recipe-tags` design. A category that no tag uses any more is removed.
- The recipe-card pill and the home page's sort control are extracted to `shared/` so both pages share one look.
- Out of scope: filtering recipes by tag, grouping the home page by category (card #50), tags on the recipe page, editing categories apart from through their tags.

## Capabilities

### New Capabilities

- `tag-management`: the tag manager page: listing, ordering, filtering, adding, editing name and category, merging, deleting and bulk category assignment.

### Modified Capabilities

- `site-menu`: the sidebar gets a "Tags" link for every role.
- `recipe-storage`: a tag can have one category; categories are stored by unique name and removed when no tag uses them.

## Impact

- DB: migration `0014_tag_categories.sql`; `src/db/seed/dev.sql`; `migrations.test.ts`, `seed/dev.test.ts`.
- Server: new `shared/tagManagement.server.ts` (list with counts and category, add, save, merge, delete, bulk category, list categories) and tests.
- Route: new module `routes/tags/` (`TagsPageRoute.tsx`, `lib/`), `routes.ts`, `SiteMenu.tsx`.
- Shared: new `shared/components/Pill.tsx` and a segmented radio control taken from `FilterBar.tsx`; `RecipeCard.tsx` and `FilterBar.tsx` use them (no behavior change, test ids stay).
- Depends on `add-recipe-tags` (merged, #87; its delta specs are not yet synced into the main specs, so this change only ADDS requirements to `recipe-storage`) and on the menu requirement as modified by `add-logout-link` (its text is the base of the `site-menu` delta).
