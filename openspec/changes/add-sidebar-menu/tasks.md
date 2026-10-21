## 1. Placeholder screens

- [x] 1.1 Add `shared/WorkInProgress.tsx` (banner "Dit scherm is nog in aanbouw" in `<main id="main">`, with a heading prop)
- [x] 1.2 Add `routes/settings/route.tsx` ("Instellingen") and `routes/about/route.tsx` ("Over") using it, each with `meta`
- [x] 1.3 Register `instellingen` and `over` in `routes.ts` inside the layout

## 2. Menu

- [x] 2.1 Add `shared/SiteMenu.tsx`: menu button, `<dialog>` sidebar with close button and the three links; closes on Escape, backdrop click and link click
- [x] 2.2 Put `SiteMenu` in `Header.tsx`; keep the "Nieuw recept" link and check the narrow-screen layout still fits

## 3. Tests

- [x] 3.1 `SiteMenu.test.tsx` for the three `site-menu` menu scenarios (`site-menu › Menu lists the links`, `… › Menu closes`, `… › Following a link closes the menu`)
- [x] 3.2 Route tests for `site-menu › Settings page` and `site-menu › About page`

## 4. Finish

- [x] 4.1 `pnpm format:fix`, `pnpm lint:fix`, then `pnpm format:check`, `pnpm lint:check`, `pnpm test:ai`
