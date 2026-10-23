# Source structure

The folder layout and the rules under "Modules" are rules. The rest are recommendations: deviate when it makes sense.

```
src/
  app/
    root.tsx, routes.ts, app.css   shell, route table, tokens + base styles only
    routes/<name>/                 one module per route: route files plus `lib/` with everything only that route uses
    shared/                        module with everything used by 2+ routes/layouts or the shell (change with care)
  workers/                         Worker entry (app.ts) and request handler
  db/                              D1 migrations and seed data
  testing/                         shared test helpers
```

Paths below are relative to `src/app/` unless they start with `src/`. Server-only modules are named `*.server.ts`; the build fails if browser code imports them.

## Modules

A module is a folder directly under `routes/` (e.g. `routes/recipe/`, including its `lib/`) or `shared/`.

- **Imports inside a module are relative** (`./x`, `../lib/x`). **Imports outside it are absolute** (`~app/...`, `~testing/...`), never `../` out of the module. Files directly under `app/` (`root.tsx`, `routes.ts`) are not in a module and are exempt.
- **Routes import only from `shared/`, never from another route.** Code two routes need moves to `shared/`.
- **`shared/` imports only from itself, never from a route.** This holds for test files too.
- **A file used by only one route lives in that route.** Move it to `shared/` when a second route needs it.
- **Route file names.** `<name>PageRoute` for a route that renders a page, `<name><Action>Route` for a route with only a loader or action (e.g. `PhotoUploadRoute`, `LikeUpdateRoute`); `LayoutRoute` for a layout (`<name>LayoutRoute` once there is more than one). The test sits beside it with the same name plus `.test`.

- **Colocate first.** A component lives in the one route that uses it. Move it to `shared/` when a second route or layout needs it, not earlier. This works both ways: when removing code leaves a `shared/` file used by only one route, move it back into that route. This keeps the blast radius of a change visible from the path.
- **Route module vs component.** Only route files (`*Route.tsx`, `root.tsx`) export `loader` (server data, runs before render), `meta` (page title), `links`, `ErrorBoundary` and the default route component. A component file exports one component, with its `Props` type above it, and nothing route-related.
- **Aliases.** `~app/` is `src/app/`, `~testing/` is the shared test helpers. Aliases only change how an import is resolved; the build bundles what the app and the Worker entry import, so test files and `src/testing/` never ship.
- **Naming.** PascalCase for component files, camelCase for everything else.
- **Styling.** Tailwind utilities in the component. Combine with `cn()` (`shared/cn.ts`, tailwind-merge) so a `className` prop can override defaults. Prefer styling from real state (`aria-current`, `has-checked:`, `disabled:`) over parallel state classes. Colours and shadows come from `@theme` tokens in `app.css`; keep component classes out of it.
- **Tests sit next to the file they test.** `shared/recipes.server.ts` has `shared/recipes.server.test.ts`, so a folder listing shows what is untested. Tests with no single source file sit beside what they cover (`src/db/migrations/migrations.test.ts`, `src/db/seed/dev.test.ts`). `src/testing/` holds shared test helpers (`testing/db.ts`: an empty in-memory D1 with the migrations applied; each test inserts the data it needs, no test relies on shared data). A test that renders a component is `<name>.test.tsx` and writes JSX (the test scripts and `scripts/spec-check.ts` list both extensions); all other tests stay `.test.ts`.
