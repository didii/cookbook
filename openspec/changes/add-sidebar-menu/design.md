## Context

`shared/Header.tsx` is a server-rendered header (red bar, "Familiekookboek" link, email, "Nieuw recept" link), used by `routes/layout/route.tsx`. Routes live in `routes.ts` under `layout(...)`; page text is Dutch.

## Decisions

- **Native `<dialog>` as the sidebar.** `showModal()` gives focus trap, Escape, backdrop and inert page for free; no dependency. Styled as a panel docked to the left edge. Click-outside: close when the click target is the dialog itself (the backdrop). Needs a small client component (`shared/SiteMenu.tsx`) for the open button and handlers; the Header embeds it.
- **Links close the menu.** React Router navigation does not reload the page, so each link's `onClick` calls `close()`.
- **Header "Nieuw recept" link stays.** It is a primary action and is covered by `recipe-creation` scenarios; the menu duplicates it rather than moving it. Easy to drop later.
- **Placeholders share one banner.** `shared/WorkInProgress.tsx` renders the banner (`role="status"`) inside `<main id="main">`; the two routes only add their `meta` title and a heading. Alternative: one generic route with a param. Rejected: the screens will diverge.
- **Paths in Dutch like the rest:** `/instellingen`, `/over`, inside the header layout so the menu is available there.

## Risks

- `showModal()` in happy-dom may be missing; tests fall back to checking the `open` attribute, or a stub in `~testing/dom` if needed.
