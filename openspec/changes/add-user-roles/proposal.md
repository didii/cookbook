## Why

Admin features are coming (managing the cookbook, giving others admin rights), but the cookbook has no notion of who may do what. Every member is equal today. Roles must exist on users first, with a first superadmin, before any admin feature can be built.

## What Changes

- Every user has one of three roles: `user`, `admin` or `superadmin`. A member without a stored role is a `user`, so everything that exists today stays user-level.
- A superadmin can give and take away the admin role, and can do everything an admin can. An admin can do admin things, a user only user things.
- The first superadmin, `info@rhythm-coder.dev`, is seeded by a database migration.
- The role of a user can be read in code, so later changes can use it.
- Out of scope: any admin feature, any screen to change roles, and checking roles on pages or data endpoints. Nothing is refused or hidden yet.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `users`: a user has a role; the seeded superadmin; what each role is allowed to do.

## Impact

- New migration `packages/web/migrations/0006_roles.sql`: roles table and the superadmin seed.
- `packages/web/app/.server/users.ts`: `User` gets a `role`.
- Tests in `migrations.test.ts` and `users.test.ts`.
- `info@rhythm-coder.dev` must also be on the family allowlist (Cloudflare Access, outside this repo), or the seeded superadmin cannot sign in.
