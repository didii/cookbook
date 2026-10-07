# Tasks

Tasks marked **(owner)** need the repo owner to act in the Cloudflare dashboard or a browser; the rest can be done from the repo.

## 1. Scaffold the app

- [x] 1.1 Generate the React Router app with Cloudflare's starter (`npm create cloudflare@latest -- --framework=react-router`) and merge it into `packages/web` of an npm workspace, keeping the existing `volta.node` pin in the root `package.json`; verify `npm install` succeeds and a `package-lock.json` is produced
- [x] 1.2 Extend `.gitignore` for the new tooling (`.wrangler/`, `.dev.vars`, `.react-router/`, `build/`); verify `git status` shows none of those paths after a build
- [x] 1.3 Verify `npm run dev` serves the template page locally and `npm run build` and `npm run typecheck` pass

## 2. Database binding and migrations

- [x] 2.1 Declare the D1 binding `DB` in `wrangler.jsonc` with `migrations_dir` set to `migrations/`, add an empty `migrations/` directory, and regenerate binding types; verify typecheck passes with `env.DB` typed
- [x] 2.2 Add npm scripts `db:migrate:local` and `db:migrate:remote` wrapping `wrangler d1 migrations apply`; verify `npm run db:migrate:local` exits successfully and reports no migrations to apply

## 3. Identity

- [x] 3.1 Add `jose` and implement the identity function that verifies the Access token (signature, audience, expiry) and returns the email or nothing, taking all inputs as arguments
- [x] 3.2 Add tests for the identity function using `node --test` and a locally generated key pair, covering: valid token returns the email, missing token, bad signature, wrong audience, expired token, stand-in email honored only when passed in; verify `npm test` passes
- [x] 3.3 Call the identity function for every request in the Worker entry, responding 403 when no identity is established and passing the stand-in email only when `import.meta.env.DEV` is true; verify a local request with no `DEV_USER_EMAIL` set returns 403
- [x] 3.4 Add `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD` as variables in `wrangler.jsonc` and a `.dev.vars.example` containing `DEV_USER_EMAIL`; verify typecheck passes with both variables typed

## 4. Home page

- [x] 4.1 Replace the template home route with a page whose loader runs `SELECT 1` against `DB` and returns the signed-in email; verify that with `DEV_USER_EMAIL` set, `npm run dev` shows that email in server-rendered HTML (visible in view-source)

## 5. Cloudflare setup and first deploy

- [x] 5.1 **(owner)** Create or choose the Cloudflare account, add the cookbook's domain to it, and run `wrangler login`; verify `wrangler whoami` shows the account
- [x] 5.2 Create the D1 database with `wrangler d1 create` and put its id in `wrangler.jsonc`; verify `npm run db:migrate:remote` exits successfully
- [x] 5.3 Set the custom-domain route, `workers_dev: false` and `preview_urls: false` in `wrangler.jsonc`, and add a `deploy` npm script (build, then `wrangler deploy`)
- [x] 5.4 **(owner)** Enable the Zero Trust free plan, create an Access application for the cookbook's domain with one-time-PIN login, an allow policy listing the family emails, and the session duration set to one month; copy the team domain and audience tag into `wrangler.jsonc`
- [x] 5.5 Run `npm run deploy`; verify the deploy succeeds and the Worker has no `workers.dev` or preview address enabled
- [x] 5.6 Write a README covering local development, the migration and deploy commands, and the one-time dashboard steps from 5.1 and 5.4 including where each config value comes from; verify the documented commands run as written

## 6. End-to-end check

- [x] 6.1 **(owner)** Open the cookbook's domain in a private browser window, sign in with an allowlisted email, and verify the home page shows that email; then try a non-allowlisted email and verify no page is shown
- [x] 6.2 Verify a request to the deployed domain that bypasses the browser session (`curl` with no cookies, and again with a made-up `Cf-Access-Authenticated-User-Email` header) never returns cookbook content
