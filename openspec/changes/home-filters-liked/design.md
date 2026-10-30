# Design

## Context

The filters live in `FilterBar` (one `search` element, sheet plus bar, `md:` classes switch between phone and wide) and `filterRecipes.ts`; `Filters` and the address mapping are in `shared/filterParams.ts`. `RecipeSummary.liked` (the signed-in member's own like) is already in the loader data, so filtering is client-side like the other filters. Visual reference: `docs/design/home-filters.html`. See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**
- A favourites filter that behaves like the other filters (address, clear, count).
- The approved wide layout, with the phone layout unchanged apart from the toggle.

**Non-Goals:**
- No change to likes, loader or database.
- No sort by likes.

## Decisions

- **`Filters.liked?: boolean`**, address `favoriet=1`, omitted when off. Same pattern as the other fields; `parseFilters` reads `favoriet === '1'`, `filterParams` writes it, `noFilters` leaves it off. `filterRecipes` takes `Pick<RecipeSummary, … 'liked'>` and drops unliked recipes. `isFiltered` and `activeFilterCount` count it (one).
- **Toggle is its own button in `FilterBar`**: `aria-pressed`, `aria-label="Mijn favorieten"`, `MapleLeaf` icon, styled like `LikeButton` (white outline off, red filled on, yellow hover). Not reusing `LikeButton`: that one posts a like, this one only toggles a filter. Only `FilterBar` uses it, so it stays in `routes/home/lib/`.
- **One toggle, two positions**: rendered twice, in the sort row of the sheet below 48rem and in the search row from 48rem, each hidden at the other size (`display: none`), both reading the same state. Alternative: one element moved with grid areas; rejected because the sheet is hidden while closed on a phone and the toggle on wide screens must not live inside it.
- **Wide layout**: the sheet becomes a grid `1fr 1fr auto` from 48rem (two columns below 64rem, sort spanning both), the search row stays under the sheet in the DOM (`flex-col-reverse`) and loses its `md:max-w-lg`. No panel background, border or shadow. "Wis filters" moves into a footer row (dashed top border, right-aligned) from 48rem; on a phone the existing full-width button stays. The sort legend becomes a stacked label like the two fields (no `md:float-left`).
- **Empty-state button** (`HomePage-clear`) already calls `noFilters`, so favourites clear with it.

## Risks / Trade-offs

- [Two toggle buttons in the DOM] → only one is shown at a time; the hidden one is out of the tab order and the accessibility tree.
- [Icon-only button] → `aria-label` and `title` "Mijn favorieten"; the pressed state is not colour alone (filled versus outlined leaf), and the count badge shows it while the sheet is closed.
