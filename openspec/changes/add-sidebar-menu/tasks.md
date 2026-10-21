## 1. Placeholder screens

- [ ] 1.1 Add `shared/WorkInProgress.tsx` (banner "Dit scherm is nog in aanbouw" in `<main id="main">`, with a heading prop)
- [ ] 1.2 Add `routes/settings/route.tsx` ("Instellingen") and `routes/about/route.tsx` ("Over") using it, each with `meta`
- [ ] 1.3 Register `instellingen` and `over` in `routes.ts` inside the layout

## 2. Menu

- [ ] 2.1 Add `shared/SiteMenu.tsx`: menu button, `<dialog>` sidebar with close button and the three links; closes on Escape, backdrop click and link click
- [ ] 2.2 Put `SiteMenu` in `Header.tsx`; keep the "Nieuw recept" link and check the narrow-screen layout still fits

## 3. Tests

- [ ] 3.1 `SiteMenu.test.tsx` for the three `site-menu` menu scenarios (`site-menu › Menu lists the links`, `… › Menu closes`, `… › Following a link closes the menu`)
- [ ] 3.2 Route tests for `site-menu › Settings page` and `site-menu › About page`

## 4. Finish

- [ ] 4.1 `pnpm format:fix`, `pnpm lint:fix`, then `pnpm format:check`, `pnpm lint:check`, `pnpm test:ai`
