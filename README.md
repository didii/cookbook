# Cookbook

Family cookbook. React Router (server-rendered) on Cloudflare Workers, with a D1 database and Cloudflare Access for login.

## Local development

```bash
pnpm install
cp .dev.vars.example .dev.vars
pnpm dev
```

Cloudflare Access does not run locally. `DEV_USER_EMAIL` in `.dev.vars` stands in for the signed-in family member; without it every request gets a 403. It is ignored in production builds.

The local database is a SQLite file under `.wrangler`, so no Cloudflare account is needed.

| Command                                 | What it does                                                                                           |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `pnpm dev`                              | Dev server with hot reload                                                                             |
| `pnpm test`                             | All tests; scenarios of `openspec/specs` need a test                                                   |
| `pnpm test:ai`                          | Same, compact `dot` reporter                                                                           |
| `pnpm test:ci`                          | Same, plus `junit.xml` (used by CI)                                                                    |
| `pnpm test:ui`                          | Vitest UI in the browser (watch mode)                                                                  |
| `pnpm test:spec <change>`               | Also require tests for the scenarios of an OpenSpec change, e.g. `pnpm test:spec redesign-recipe-view` |
| `pnpm lint:check` / `pnpm lint:fix`     | Check / fix lint errors                                                                                |
| `pnpm format:check` / `pnpm format:fix` | Check / fix formatting                                                                                 |
| `pnpm typecheck`                        | Regenerate types and typecheck                                                                         |
| `pnpm build`                            | Production build                                                                                       |

## Branches

Work on a `feature/<name>` branch off `main` and merge it through a pull request.

## Database migrations

Schema changes are SQL files in `migrations`.

```bash
npx wrangler d1 migrations create DB <name>   # new migration file
pnpm db:migrate:local                                       # apply to the local database
pnpm db:migrate:remote                                      # apply to the deployed database
```

## Deploy

```bash
pnpm db:migrate:remote
pnpm run deploy
```

Roll back a bad deploy with `npx wrangler rollback`.

## Guides

Manual tasks that happen outside the codebase are written up in [`docs/`](docs):

- [Cloudflare setup](docs/cloudflare-setup.md): one-time setup of the account, database, domain and login, for rebuilding from scratch.
- [Add or remove a family member](docs/add-family-member.md): who can sign in.

## Kanban board

Quick and dirty Kanban board to manage progress: https://claude.ai/artifact/WKZqbBbofJm2XhEkwtwYBT
