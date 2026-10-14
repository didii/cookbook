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
- **Imports.** Relative within the same route folder, `~/` for anything outside it. `lib/identity.ts`, `test/` and `workers/` stay relative because `node --test` does not resolve `~/`.
- **Naming.** PascalCase for component files, camelCase for everything else.
- **Styling.** Tailwind utilities in the component. Combine with `cn()` (`shared/cn.ts`, tailwind-merge) so a `className` prop can override defaults. Prefer styling from real state (`aria-current`, `has-checked:`, `disabled:`) over parallel state classes. Colours and shadows come from `@theme` tokens in `app.css`; keep component classes out of it.
