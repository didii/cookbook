# Tasks

## 1. Role in the database

- [x] 1.1 Add `packages/web/migrations/0006_roles.sql`: `users.role` column (default `user`, limited to `user`/`admin`/`superadmin`) and the `info@rhythm-coder.dev` superadmin seed as an upsert (calling name `Dieter`). Verify with `migrations.test.ts` tests `users › Unknown role is refused`, `users › Seeded superadmin`, `users › Seeded address in another case` and `users › Seed promotes an existing member`.

## 2. Role on the user

- [x] 2.1 Add `role: 'user' | 'admin' | 'superadmin'` to `User` in `packages/web/app/.server/users.ts` and read it in `getUser`. Verify with `users.test.ts` tests `users › New member is a user`, `users › Existing member is a user` and `users › Seeded superadmin is known without the welcome screen`.
- [x] 2.2 Add `test.todo('users › Today\'s features need no role')`, since nothing checks roles yet and the existing route tests already show the pages. Verify `pnpm test:spec add-user-roles` lists no scenario without a test.

## 3. Finish

- [x] 3.1 Run `pnpm format:fix`, `pnpm lint:fix`, then `pnpm format:check`, `pnpm lint:check` and `pnpm test:ai`; all pass.

## Workflow follow-up

- Before deploying, add `info@rhythm-coder.dev` to the family allowlist in Cloudflare Access.
