# Cookbook

Family cookbook. React Router (server-rendered) on Cloudflare Workers, with a D1 database and Cloudflare Access for login.

The app lives in `packages/web`. All commands below run from the repo root.

## Local development

```bash
npm install
cp packages/web/.dev.vars.example packages/web/.dev.vars
npm run dev
```

Cloudflare Access does not run locally. `DEV_USER_EMAIL` in `.dev.vars` stands in for the signed-in family member; without it every request gets a 403. It is ignored in production builds.

The local database is a SQLite file under `packages/web/.wrangler`, so no Cloudflare account is needed.

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm test` | Unit tests |
| `npm run typecheck` | Regenerate types and typecheck |
| `npm run build` | Production build |

## Database migrations

Schema changes are SQL files in `packages/web/migrations`.

```bash
npx -w @cookbook/web wrangler d1 migrations create DB <name>   # new migration file
npm run db:migrate:local                                       # apply to the local database
npm run db:migrate:remote                                      # apply to the deployed database
```

## Deploy

```bash
npm run db:migrate:remote
npm run deploy
```

Roll back a bad deploy with `npx -w @cookbook/web wrangler rollback`.

## Guides

Manual tasks that happen outside the codebase are written up in [`docs/`](docs):

- [Cloudflare setup](docs/cloudflare-setup.md): one-time setup of the account, database, domain and login, for rebuilding from scratch.
- [Add or remove a family member](docs/add-family-member.md): who can sign in.
