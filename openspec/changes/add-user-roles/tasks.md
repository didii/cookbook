# Tasks

## 1. Roles in the database

- [x] 1.1 Add `packages/web/migrations/0006_roles.sql`: `roles` table (email unique, case-insensitive; role limited to `admin`/`superadmin`) and the `info@rhythm-coder.dev` superadmin seed. Verify with `migrations.test.ts` tests `users › Unknown role is refused`, `users › Seeded superadmin` and `users › Seeded address in another case`.

## 2. Role on the user

- [x] 2.1 Add `role: 'user' | 'admin' | 'superadmin'` to `User` in `packages/web/app/.server/users.ts` and read it in `getUser` via `LEFT JOIN roles` with `COALESCE(..., 'user')`. Verify with `users.test.ts` tests `users › New member is a user`, `users › Existing member is a user` and `users › Seeded superadmin` (welcomed user has the role).
- [ ] 2.2 Add `test.todo('users › Today\'s features need no role')`, since nothing checks roles yet and the existing route tests already show the pages. Verify `pnpm test:spec add-user-roles` lists no scenario without a test.

## 3. Finish

- [ ] 3.1 Run `pnpm format:fix`, `pnpm lint:fix`, then `pnpm format:check`, `pnpm lint:check` and `pnpm test:ai`; all pass.

## Workflow follow-up

- Before deploying, add `info@rhythm-coder.dev` to the family allowlist in Cloudflare Access.
