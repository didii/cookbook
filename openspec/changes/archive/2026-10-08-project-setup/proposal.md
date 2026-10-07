# Proposal

## Why

The repo is empty apart from a Node version pin, and the family cookbook needs a running, deployable, login-protected app before any recipe feature can be built. The stack was chosen during exploration to keep cost near zero and operations near none, so that effort goes into recipe UX instead of infrastructure.

## What Changes

- Add a TypeScript full-stack web app using React Router (v8, the current release) in framework mode with server-side rendering, in `packages/web` of an npm workspace.
- Host it on Cloudflare Workers, with the deployment described by a Wrangler config committed to the repo.
- Bind a D1 (managed SQLite) database and establish SQL migration files in the repo as the way schema changes are made. No tables are created in this change.
- Put the site behind Cloudflare Access: family members sign in with a one-time code sent to their email, limited to an allowlist of family emails, with no account to create.
- Have the app establish who the signed-in member is on every request from the identity Access provides, and refuse requests that lack it.
- Provide a local development setup that runs the app and database on the developer's machine without a Cloudflare login.
- Add a single home page that shows the signed-in member's email, as proof that rendering, database and identity work end to end.

Out of scope: the recipe data model, recipe input and viewing, photo storage (R2 is the chosen store, but its bucket and binding arrive with the first photo feature), offline support, Google sign-in, in-app invites, page caching, and CI-based deployment.

## Capabilities

### New Capabilities

- `family-access`: who can reach the cookbook, how they sign in, and how the app knows which family member is making a request.

### Modified Capabilities

None.

## Impact

- **Code**: new app source, build configuration, Wrangler config and migrations directory in `packages/web`; the root `package.json` becomes a workspace root with pass-through scripts and keeps the existing Node pin. The unused C# rules are removed from `.gitignore` because they ignore any `packages` folder.
- **Dependencies**: React Router v8, Vite, Wrangler and the Cloudflare Vite plugin, plus one small library for verifying signed identity tokens.
- **External systems**: a Cloudflare account with the Zero Trust free plan, a domain managed by Cloudflare, one D1 database, and one Access application with a family email allowlist. The Access application and DNS are configured once in the Cloudflare dashboard, not in code.
- **Cost**: the domain registration; everything else is expected to stay within free tiers.
