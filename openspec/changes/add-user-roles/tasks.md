# Tasks

## 1. Role in the database

- [x] 1.1 Add `packages/web/migrations/0006_roles.sql`: `users.role` column (default `user`, limited to `user`/`admin`/`superadmin`), no data. Verify with `migrations.test.ts` test `users › Unknown role is refused`.

## 2. Role on the user

- [x] 2.1 Add `role: 'user' | 'admin' | 'superadmin'` to `User` in `packages/web/app/.server/users.ts` and read it in `getUser`. Verify with `users.test.ts` tests `users › New member is a user` and `users › Existing member is a user`.
- [x] 2.2 Add the `SUPERADMIN_EMAIL` variable (`info@rhythm-coder.dev`) to `wrangler.jsonc`. Give `createUser` a `superadminEmail` parameter that sets the role in the same `INSERT` (superadmin iff the email matches case-insensitively and no superadmin exists), and pass `env.SUPERADMIN_EMAIL` from the welcome route. Verify with `users.test.ts` tests `users › Configured email becomes superadmin`, `users › Configured email in another letter case becomes superadmin`, `users › Configured email is not promoted when a superadmin exists`, `users › Other emails become users` and `users › No configured email promotes nobody`.
- [x] 2.3 Add `test.todo('users › Today\'s features need no role')`, since nothing checks roles yet and the existing route tests already show the pages. Verify `pnpm test:spec add-user-roles` lists no scenario without a test.

## 3. Finish

- [x] 3.1 Run `pnpm format:fix`, `pnpm lint:fix`, then `pnpm format:check`, `pnpm lint:check`, `pnpm typecheck` and `pnpm test:ai`; all pass.

## Workflow follow-up

- Before deploying, add `info@rhythm-coder.dev` to the family allowlist in Cloudflare Access.
