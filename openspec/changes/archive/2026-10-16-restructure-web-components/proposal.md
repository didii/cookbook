# Proposal

## Why

`packages/web` is small now (~800 lines) but will grow a lot. Today every component class lives in one 350-line global `app.css`, components share one `components.tsx`, and there is no stated convention for what a route file may export (`loader`, `meta`, ...) versus a plain component. Before more screens land, structure the package so that the blast radius of changing a file is obvious from where it lives.

## What Changes

- Colocate components with the route that uses them: `routes/<name>/route.tsx` plus its own component files.
- Add `app/shared/` for components used by two or more routes (or the shell and routes): `Header`, `SkipLink`, `TileDefs`, `TileBand`, `Button`, and the `cn` helper. A component moves to `shared/` only when a second consumer appears; everything in `shared/` is "change with care".
- Move non-component modules (`context.ts`, `identity.ts`, `recipes.ts`, `tileFor`) to `app/lib/`.
- Migrate all component classes in `app.css` to Tailwind utilities inside the components. `app.css` keeps only `@import`, `@theme` tokens, `::selection`, `:focus-visible` and base `html`/`body` rules.
- Add `tailwind-merge` and a `cn()` helper so a component's `className` prop can override its defaults.
- Style from native/ARIA state (`aria-current`, `has-[:checked]`, `disabled:`) instead of parallel state classes (`.on`, `.done`).
- Use the existing `~/` alias (already in `tsconfig.cloudflare.json`) for cross-folder imports.
- Document the file conventions as recommendations (not rules) in a succinct `packages/web/STRUCTURE.md`, referenced from a new `packages/web/CLAUDE.md` so it is always in context: route modules (only place for `loader`, `meta`, `links`, `ErrorBoundary`, default route component) versus component files (one PascalCase component, a `Props` type, `className` styling, no route exports); non-components in camelCase.
- **No visual change** and no behaviour change.

## Capabilities

### New Capabilities
<!-- none: pure refactor, no spec-level behavior changes -->

### Modified Capabilities
<!-- none -->

`.openspec.yaml` sets `skip_specs: true`: this change reorganizes code and styling only.

## Impact

- `packages/web/app/**`: files moved/renamed, `app.css` shrunk, markup classes rewritten.
- `packages/web/workers/app.ts` and `packages/web/test/identity.test.ts`: import paths only (`../app/context` and `../app/identity` become `../app/lib/...`). Note the test runs under plain `node --test`, so `lib/identity.ts` must keep relative imports (no `~/`).
- `app/routes.ts` points at the new `route.tsx` files.
- New dependency: `tailwind-merge`.
- Out of scope: recipe content, data layer (D1), `workers/app.ts` logic, test logic, visual redesign.
- Verification: compare home and recipe pages (desktop and mobile) against `packages/web/.impeccable/review/*.png`; small pixel-level differences are acceptable for now.
