## Why

The three admin pages (Herkenning, Foto's, Gebruikers) are separate entries in the site menu and know nothing of each other, so an admin has to open the menu again to go from one to the next. One admin area with a shared navigation keeps the site menu short and makes the admin tasks easy to hop between. The Herkenning page is also very long, since all its lists are open at once.

## What Changes

- A new layout around the existing admin pages, under `/beheer`, with a navigation to the pages in this order: "Herkenning", "Foto's", "Gebruikers". The route paths do not change.
- From 64rem the navigation is a sticky column at the left of the content. Below that width the same list sits on top of the content, stacked, and scrolls away with the page.
- The current page is marked (yellow, ink border, hard shadow; `aria-current="page"`). An item is only shown to a role that may use the page: an `admin` sees "Herkenning" and "Foto's", a `superadmin` also "Gebruikers". The pages keep refusing other roles on the server; the navigation is only a convenience.
- `/beheer` itself goes to `/beheer/herkenning`.
- The site menu gets one link "Beheer" for `admin` and `superadmin`, which replaces "Herkenning", "Foto's" and "Gebruikers".
- On the Herkenning page each section heading (Eenheden, Duur, Graden, Basisproducten) folds its lists open and closed, closed at first. Folding only hides: typed rows stay and the one form still posts every list. A section with a message after a refused save opens itself.
- The fixed bars at the bottom (Herkenning's save bar, Foto's delete bar) start where the content column starts.
- Pages keep their content, loaders, actions and tests; only the frame around them changes. The Gebruikers page is not redesigned (the mockup draws it simplified).
- The visual design is approved: `docs/design/admin.html`.

## Capabilities

### New Capabilities

- `admin-nav`: the shared admin area: the navigation, which items each role sees, the redirect from `/beheer`, and the layout of the content next to it.

### Modified Capabilities

- `site-menu`: one link "Beheer" for admins and superadmins instead of "Herkenning", "Foto's" and "Gebruikers".
- `parsing-rules`: the section headings fold their lists, closed at first; the requirement for the menu link "Herkenning" goes, as the admin navigation now owns it.

## Impact

- New route module `src/app/routes/admin/` (`AdminLayoutRoute.tsx`, `AdminIndexRoute.ts` for the redirect, `lib/AdminNav.tsx`); `routes.ts` nests the three admin routes under it inside the site layout.
- `SiteMenu.tsx`: one admin link; its tests change.
- The three page routes drop their own `<main>` width and gutters; `RulesForm.tsx` gets folding sections; `RulesBar` and the photos bar take the column offset.
- No data, migration or dependency change.
- Order: `add-fridge-search` and `remove-orphaned-photos` are merged but not archived, and both change the site-menu requirement. Archive them first, then this change, which is written against their result.
