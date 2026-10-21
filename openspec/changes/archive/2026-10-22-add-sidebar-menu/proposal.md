## Why

The header only links to "Nieuw recept". Settings and an about page are coming; a menu gives them a place to live, and every page one consistent way to reach them.

## What Changes

- The site header gets a menu button that opens a sidebar with links to: new recipe, user settings, about.
- New routes for user settings and about. Both only show a banner saying the screen is work in progress.
- The existing "Nieuw recept" link in the header stays as it is.

## Capabilities

### New Capabilities

- `site-menu`: the sidebar menu in the header, its three links, and the work-in-progress screens it leads to.

### Modified Capabilities

None.

## Impact

- `packages/web/app/shared/Header.tsx` (menu button + sidebar), new `routes/settings/route.tsx` and `routes/about/route.tsx`, `routes.ts`.
- No new dependencies, no data or API changes.
