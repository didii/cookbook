## Context

Today `routes.ts` lists `beheer/herkenning`, `beheer/fotos` and `beheer/gebruikers` (with the child `:id`) as flat siblings inside the site layout. Each page renders its own `<main id="main">` with `mx-auto max-w-3xl px-[max(1rem,4vw)]`, and each page protects itself with `requireAdmin` or `requireSuperadmin` in its loader and action. Two pages fix a bar to the bottom with the same `max-w-3xl` container: `RulesBar` and the bar of `PhotoList`. The site layout reads the role from the `root` loader (`useRouteLoaderData('root')`). The approved design is `docs/design/admin.html`.

## Goals / Non-Goals

**Goals:**
- One layout route for `/beheer` that owns the navigation, the width and the gutters.
- The pages' content, loaders, actions and tests stay as they are.

**Non-Goals:**
- No change to who may do what: the server checks stay in the pages and are not moved into the layout.
- No sub-items in the navigation, no split of the Herkenning page, no redesign of the Gebruikers page.

## Decisions

**A path layout route.** `routes.ts` gets `route('beheer', 'routes/admin/AdminLayoutRoute.tsx', [index('routes/admin/AdminIndexRoute.ts'), route('herkenning', …), route('fotos', …), route('gebruikers', …, [route(':id', …)])])` inside the site `layout(...)`. The URLs do not change, the `:id` route still nests under the users page, and the index route gives `/beheer` a place for its redirect (a loader that returns `redirect('/beheer/herkenning')`). Alternative: a pathless layout wrapping the three flat routes plus a separate `route('beheer', …)` for the redirect; rejected, as the path layout says the same in one place.

**The layout does no access check.** It takes the role from the `root` loader, as the site layout does, and filters the items. A plain `user` who opens `/beheer` is redirected to the rules page, which answers 403 as before. Alternative: a `requireAdmin` in the layout loader; rejected, as it would make the pages' own checks look redundant when they are the real protection (the specs require each page to refuse on its own).

**The nav items live in `AdminNav`, with a role per item.** A short list of `{ to, label, superadmin? }` like `SiteMenu`'s `links`. The component takes `role` and renders `NavLink`s: `aria-current="page"` comes from React Router, and "Gebruikers" stays current on `/beheer/gebruikers/12` (`NavLink` matches on the path prefix). The current state is styled from `aria-current`, not a parallel class (STRUCTURE.md).

**The layout owns `<main id="main">`.** It renders a grid: the nav, then `<main id="main">` holding the `Outlet`. The three pages replace their `<main>` by a fragment or a `<div>`, so a page has one `main` and the skip-link target stays. The grid is one column below 64rem (nav above) and `14rem 1fr` from 64rem, the nav sticky under the header. The content column keeps the `max-w-3xl`.

**The geometry is shared with the fixed bars.** The two bars sit outside the grid (they are `fixed`), so they need the same columns to start where the content starts. The column classes go in one file in `shared/` (`shared/adminShell.ts`: the shell's `max-w`, gutters and the `lg:` grid columns), which the layout and both bars import; it is used by three routes, so it belongs in `shared/`. Alternative: `@theme` tokens in `app.css` for the 14rem and the gap only; rejected, as the bars would still repeat the grid.

**Folding with `<details>`/`<summary>`.** Each section of `RulesForm` becomes a `<details>` whose `<summary>` holds the `h2`. A closed `<details>` keeps its content in the DOM and its form fields still submit, which is what the spec asks (hidden, not removed). Closed at first; `open` is set when the section has a message after a refused save. The form is remounted on every answer (it is keyed on the answer), so the `open` prop only has to be right at mount; a user's own toggling is not fought. After a refused save the first row with a message takes focus, which works because its section is open at mount. Alternative: a React state per section plus `hidden`; rejected, as `<details>` gives the keyboard and screen-reader behaviour for free.

**Page chrome.** Page titles (`meta`), the `h1` and the content stay in the pages. The sticky nav sits below the site header (`top` set from the header height token).

## Risks / Trade-offs

- [The geometry must stay in step between the nav column and the two bars] → One shared file feeds all three; a component test per bar checks it takes the column offset from there.
- [`remove-orphaned-photos` and `add-fridge-search` are merged but not archived, and both change the `site-menu` requirement this change modifies] → Archive them first; the delta here is written against their result (it already lists "Koelkast").
- [Closed sections hide a refused save's message on a section the admin did not open] → The sections with a message open themselves at mount.
- [A `<details>` marker and `summary` differ per browser] → The marker is replaced by a drawn chevron; the check is by hand in the browser at 390px and 1000px.
- [An admin with a bookmark to a page keeps working] → The paths do not change.
