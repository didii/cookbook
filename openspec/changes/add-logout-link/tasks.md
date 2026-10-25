# Tasks

## 1. Logout item

- [x] 1.1 In `SiteMenu.tsx`, add "Uitloggen" as last item for every role: a plain `<a href="/cdn-cgi/access/logout">` (full page load, not a router `Link`), styled like the other items. Verify `pnpm test:ai` passes for `SiteMenu.test.tsx`.
- [ ] 1.2 Update `SiteMenu.test.tsx`: the three "Menu lists the links" describes expect "Uitloggen" last; add a `site-menu › Logging out` describe checking the item's `href`. Verify `pnpm test:spec add-logout-link` reports no missing scenario.
- [ ] 1.3 Run `pnpm format:fix`, `pnpm lint:fix`, then confirm with `pnpm format:check` and `pnpm lint:check`.
