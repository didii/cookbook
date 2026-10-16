# Design

## Context

See proposal.md for motivation. Current state: React Router 8 (framework mode) on Cloudflare Workers, Tailwind v4 via `@tailwindcss/vite`, but all styling is hand-written classes in `app/app.css`. `tsconfig.cloudflare.json` already defines `~/*` -> `./app/*` and `vite.config.ts` has `resolve.tsconfigPaths: true`, so the alias needs no new config. `test/identity.test.ts` runs under plain `node --test` with no alias resolution.

## Goals / Non-Goals

**Goals**
- Where a file lives tells you its blast radius.
- A new contributor can tell a route module from a component at a glance.
- Styling is local to the component.

**Non-Goals**
- No visual redesign, no new components beyond extracting existing markup, no change to data or auth code.

## Decisions

### Target layout

```
app/
  root.tsx                 Layout, App shell, ErrorBoundary, links, loader
  routes.ts
  app.css                  @import, @theme tokens, ::selection, :focus-visible, base html/body
  routes/
    home/
      route.tsx            meta + default; composes RecipeCard
      RecipeCard.tsx
    recipe/
      route.tsx            loader + meta + default
      IngredientList.tsx   owns "done" state
      StepList.tsx         owns "current" state
  shared/                  2+ consumers -> change with care
    Header.tsx  SkipLink.tsx  TileDefs.tsx  TileBand.tsx  Button.tsx  cn.ts
  lib/                     context.ts  identity.ts  recipes.ts  tile.ts (tileFor)
```

`Wave` is used by the recipe route only, so it lives in `routes/recipe/`. `Header`, `SkipLink` and `TileDefs` are in `shared/` even though only `root.tsx` uses them today, because other layouts (e.g. admin/debug pages) may reuse or replace them.

### Promotion rule
A component starts next to its single route and moves to `shared/` when a second route/layout imports it, never earlier. Alternative considered: a flat `components/` folder. Rejected: it hides which part of the UI a change affects.

### File conventions
Written up in `packages/web/STRUCTURE.md` as short recommendations ("prefer", "usually"), since exceptions will occur. `packages/web/CLAUDE.md` imports it via `@STRUCTURE.md`. A spec was considered and rejected: the guidance must be always in context, not looked up. The points below are the content to condense.

- **Route module** (`routes/*/route.tsx`, `root.tsx`): the only files that may export `default` route component, `loader`, `meta`, `links`, `ErrorBoundary`, `Layout`. `loader` runs on the server before render, `meta` sets `<title>`. Drop the unused `{}: Route.MetaArgs` argument in `home`.
- **Component file**: one named PascalCase component export, a `Props` type directly above it, styling via `className`, local state inside it, no route exports, no route types.
- Non-component modules use camelCase filenames.
- Imports: relative within the same route folder, `~/` for anything outside it. Exceptions: `lib/identity.ts`, `test/` and `workers/` stay relative (`node --test` does not resolve `~/`).
- Routes registered with `route("recepten/:slug", "routes/recipe/route.tsx")`.

### Tailwind migration
- Tokens go in `@theme` (`--color-red`, `--color-yel`, `--color-jade`, `--color-blu`, `--color-ink`, `--color-por`, `--color-muted`, hard-shadow tokens) so utilities like `bg-red`, `text-ink`, `shadow-hard` exist.
- The repeated brutalist pattern (3px ink border + hard shadow) lives in the components (`Button`, card, hero, step), not in a global class.
- `cn = (...a) => twMerge(a)` in `shared/cn.ts`. `twMerge` accepts strings and falsy values, so `clsx` is not added. Components that take `className` pass it last so callers override defaults.
- State is styled from native/ARIA state: `.ing.done` -> `has-[:checked]:line-through ...`; `.step.on` -> `aria-[current=step]` / `has-[[aria-current=step]]`; `.btn:disabled` -> `disabled:`. No parallel state classes, so visuals cannot drift from what assistive tech announces. `data-*` only for state with no native/ARIA equivalent.
- Stay in `app.css`: `@import "tailwindcss" source(".")`, `@theme`, `::selection`, `:focus-visible`, base `html`/`body` (font, colour, line-height, background). The `.top :focus-visible` white outline becomes a `focus-visible:` utility on Header links.

### Verification
No visual regression harness exists. Use the screenshots in `packages/web/.impeccable/review/` as the reference and compare by eye; plus `npm run typecheck`, `npm test`, `npm run build`.

## Risks / Trade-offs

- [Subtle visual drift while rewriting ~350 lines of CSS] -> migrate one component at a time, compare against screenshots after each; small differences are accepted.
- [Long utility strings in markup] -> extracted components (`Button`, card) hold each string once.
- [`~/` alias breaks `node --test`] -> `lib/identity.ts` and its test keep relative imports; alias used in `app/` UI code only.
- [Tailwind v4 `has-[]`/`aria-[]` browser support] -> evergreen browsers only, acceptable for family devices; check on an older tablet if available.
