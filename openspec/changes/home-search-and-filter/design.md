# Design

## Context

- Home (`routes/home/route.tsx`) is a server loader (`listRecipes`, newest first by `id DESC`) rendering `RecipeCard`s. No client state.
- Identity: `workers/handler.ts` verifies the Access token and puts the email in `userEmailContext`. Nothing is stored about members; `recipes.created_by` is only a plain email.
- Buttons: `shared/Button.tsx` and `routes/recipe/TimerChip.tsx` each press differently (2px move + 1px shadow). `TabBar` selected tabs and some cards use `shadow-hard-sm` but are not pressed controls.
- Mockup (authoritative for look and behaviour): `docs/design/home.html`, also at https://claude.ai/artifact/DL2Yngucy4nyzfPqaLV1Vp
- Delivery: five stacked PRs, in the order of the task sections. Each PR is shippable alone: after PR 3 the home page works without users; after PR 4 users exist but nothing reads them; PR 5 adds the marker.

## Goals / Non-Goals

**Goals:**
- Mobile first: all controls reachable by the thumb, two recipes visible per screen.
- Filtering logic is a pure module with unit tests; the UI is a thin shell over it.
- One definition of the press effect, used by every shadowed button.

**Non-Goals:**
- Searching ingredients, tags or categories (no data for it; ingredient search is the obvious next step).
- Server-side search or pagination. The cookbook is hundreds of recipes at most, and the list is already sent whole.
- Per-user settings, favorites, "mark as unseen".

## Decisions

**Press effect as one shared class string (`shared/press.ts`).** `Button` and `TimerChip` (and the new Filter and "Wis filters" buttons) add it with `cn()`. The exact values live here and in task 1.1, not in the spec, so a tweak does not need a spec change: resting shadow `3px 3px 0` ink (`shadow-hard-sm`); `transition: transform .08s, box-shadow .08s` (default easing, both directions); on `:active:not(:disabled)` `translate: 3px 3px; box-shadow: none`; `motion-reduce:transition-none`. Alternative: a `@utility` in `app.css`; rejected because STRUCTURE.md keeps component classes out of `app.css`. The old 2px/1px press and the TimerChip hover lift are replaced by this one; hover colour changes stay. A "selected" look (expanded Filter, selected tab) is colour only.

**Filtering is client-side over the loaded list.** `lib/filterRecipes.ts` exports a pure `filterRecipes(recipes, { q, author, sort })` and `parseFilters(searchParams)`. Text is normalised (NFD, strip diacritics, lowercase) before a substring match on title and author. A–Z uses `Intl.Collator('nl', { sensitivity: 'base' })`; "Nieuwste" keeps loader order. Alternative: query D1 per keystroke; rejected for latency and because the whole list is already needed for the author chips.

**State lives in the URL.** `useSearchParams` with `{ replace: true }`; defaults are removed from the address. The search input is controlled from the URL value. Typing updates the URL on every keystroke; the home route sets `shouldRevalidate` to skip the loader for search-param-only navigations, so nothing is refetched.

**Author chips come from the loaded recipes** (distinct, case-insensitive, first spelling wins, sorted alphabetically). They and the sort control render only from 4 recipes up; below that only the search box. Zero recipes: no controls, the existing empty state.

**The bottom bar is plain CSS, one component for both layouts.** `FilterBar` renders the same markup. Below 48rem it is `position: fixed; bottom: 0` with `padding-bottom: env(safe-area-inset-bottom)`, and the page gets matching bottom padding. From 48rem it is in the flow, the sheet content is always shown and the Filter button is hidden. Open state is local React state, not in the URL. Layout details follow the mockup: 3px ink top border on the bar; the sheet sits inside the bar, above the input, followed by a 3px gray separator (`rgba(28,21,18,.15)`) with .75rem space on both sides, so the input keeps its position when the sheet opens. Sheet `rise` animation: `.22s cubic-bezier(.22,1,.36,1)`, none under `prefers-reduced-motion`. Escape closes the sheet and returns focus to the Filter button. Keyboard: `interactive-widget=resizes-content` in the viewport meta keeps fixed elements above the keyboard on Android; iOS Safari ignores it, so a `visualViewport` resize listener sets a `--kb` offset as a fallback.

**Card image.** `RecipeCard`'s image gets `h-auto aspect-5/2 md:aspect-16/10`, with the breakpoint at 48rem to match the bar. `height: auto` is required: the `width`/`height` attributes otherwise act as `height: 400px` and the aspect ratio is ignored. The attributes stay for layout stability.

**Users: created by an onboarding screen, not by traffic.** `users (id INTEGER PRIMARY KEY, email TEXT NOT NULL UNIQUE COLLATE NOCASE, calling_name TEXT NOT NULL CHECK (length(trim(calling_name)) > 0), created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')))`, the same timestamp format as `recipes`. Nothing else is stored (no last-seen): the table represents the person, so creating the row is idempotent (`INSERT ... ON CONFLICT (email) DO NOTHING`, first calling name wins). The root loader (`root.tsx`, now given the DB) looks the member up by email; when there is no row and the path is not `/welkom`, it redirects to `/welkom?returnUrl=<path and query of the requested page, URL-encoded>`. `routes/welcome/route.tsx` (`/welkom`): the loader redirects to the return address (or `/`) when the member is known; the action trims and validates the name (required, max 40 characters), creates the user and redirects to the return address. The return address is carried in the `returnUrl` query parameter and a hidden form field, and is used only when it is a same-site path: it must start with a single `/` (not `//` or `/\`), must not contain a scheme, and must not point at `/welkom` itself; anything else falls back to `/`. A small pure helper (`lib/returnUrl.ts`) does this check and has unit tests. The screen has the cookbook look, a short Dutch welcome, one labelled field ("Hoe noemen we je?"), one button, no header navigation. The check is one indexed read per document load; client-side navigations do not re-run the root loader unless a form is submitted, which is fine because a member is onboarded once. Resource routes (photos) are not gated. Alternative: create the row silently in the Worker handler on first request; rejected because the calling name is wanted anyway and the user asked for a welcome screen.

**Views: `recipe_views (user_id, recipe_id, first_opened_at, PRIMARY KEY (user_id, recipe_id))`**, both foreign keys `ON DELETE CASCADE`. The recipe page loader runs `INSERT OR IGNORE ... SELECT id FROM users WHERE email = ?`. Writing in a loader (a GET) is accepted because it is idempotent and per user; links do not prefetch, so a hover or scroll does not count as opening.

**"New" is computed in `listRecipes(db, email, now)`** with a `LEFT JOIN` on `recipe_views` for that member, and returns `isNew` per recipe: `created_at` after the cutoff, no view row, and `created_by` not equal (case-insensitively) to the member. The window is one named constant (`newForMonths = 1`); the cutoff is computed in JS from the injected `now`, so tests control time. A recipe without `created_by` (seed data) can be new to everyone. Own recipes are not new to the author: they just wrote it, and a marker on it would be noise.

**Marker on the card** is part of `RecipeCard` (`isNew` prop), absolute top-left over the image, mockup styling. For a card without an image it sits in the card's top-left corner over the tile band. The accessible name includes "Nieuw".

**Tests.** Pure logic (`filterRecipes`, `parseFilters`, the new cutoff) gets unit tests. SQL behaviour runs against in-memory D1 (`testing/db.ts`): users create, recipe_views, `listRecipes` flags. The welcome route's loader and action are tested like the other routes (`routes/recipe/route.test.ts` pattern), and the root loader redirect has its own test; "refused request stores nobody" is covered by the existing handler test (no app call, so no write). Visual and interaction scenarios that need a real browser (sheet position, safe area, two cards per phone screen, press timing) are `test.todo` with the reason on the line above, per CLAUDE.md. Render-level scenarios use whatever the repo already does for components (see `RecipePage.test.ts`).

## Risks / Trade-offs

- [Fixed bottom bar and the on-screen keyboard behave differently on iOS and Android] → Viewport meta plus `visualViewport` fallback, and a manual check on both before PR 3 merges.
- [One D1 read per document load for the user lookup] → Indexed unique lookup. If measured as a problem, keep the row's existence in a signed cookie.
- [`returnUrl` as an open redirect] → Only same-site paths are accepted (see the helper above); everything else goes to `/`.
- [Search is substring on two fields; no typo tolerance] → Accepted. Ingredient search is a later change.
- [Recording a view in a GET loader] → Idempotent, per user, links do not prefetch. Revisit if prefetching is ever enabled.
- [Existing recipes have `created_by` null or another email style] → Treated as not mine; they are "new" only if under a month old.
- [Changing the press effect touches existing buttons] → Visual only; checked by hand on the recipe page, editor and timers.

## Migration Plan

- `0004_users.sql` (PR 4) and `0005_recipe_views.sql` (PR 5): additive tables, no backfill. Existing members are asked for their calling name on their next visit.
- Rollback: older code ignores the tables, so reverting the app leaves them harmlessly in place.
- After PR 5 is merged, recipes added in the last month show "Nieuw" to everyone who has not opened them yet. That is intended.

## Open Questions

- Wording of the one-line introduction (placeholder: "Het kookboek van de familie. Kies iets, of zoek wat je zin hebt.").
- Which Kanban card these PRs belong to (none matched when the change was proposed).
