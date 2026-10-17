# Web package structure

Recommendations, not rules. Deviate when it makes sense.

```
app/
  root.tsx, routes.ts, app.css   shell, route table, tokens + base styles only
  routes/<name>/route.tsx        route module; its own components sit beside it
  shared/                        components used by 2+ routes/layouts (change with care)
  lib/                           non-UI modules (context, identity, data, helpers)
```

- **Colocate first.** A component lives next to the one route that uses it. Move it to `shared/` when a second route or layout needs it, not earlier. This keeps the blast radius of a change visible from the path.
- **Route module vs component.** Only route modules (`route.tsx`, `root.tsx`) export `loader` (server data, runs before render), `meta` (page title), `links`, `ErrorBoundary` and the default route component. A component file exports one component, with its `Props` type above it, and nothing route-related.
- **Imports.** Relative within the same route folder, `~/` for anything outside it. `workers/` and `testing/` stay relative: the Worker handler is also loaded outside Vite, and the shared test helper lives outside `app/`.
- **Naming.** PascalCase for component files, camelCase for everything else.
- **Styling.** Tailwind utilities in the component. Combine with `cn()` (`shared/cn.ts`, tailwind-merge) so a `className` prop can override defaults. Prefer styling from real state (`aria-current`, `has-checked:`, `disabled:`) over parallel state classes. Colours and shadows come from `@theme` tokens in `app.css`; keep component classes out of it.
- **Tests sit next to the file they test.** `lib/recipes.ts` has `lib/recipes.test.ts`, so a folder listing shows what is untested. Tests with no single source file sit beside what they cover (`migrations/migrations.test.ts`, `seed/dev.test.ts`). `testing/` holds shared test helpers (`testing/db.ts`: an in-memory D1 with the migrations applied and an optional seed). It is not named `test/` because `node --test` runs every file under a `test/` directory.
- **What to test how.** Logic and edge cases get unit tests. Each endpoint gets one integration test, the happy path, that calls the real route `loader` against a seeded in-memory D1 (see `routes/recipe/route.test.ts`). `pnpm test` runs everything through `tsx`, which resolves `~/` and JSX; no browser or network is needed.
