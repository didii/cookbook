## Why

Admin features are coming (managing the cookbook, giving others admin rights), but the cookbook has no notion of who may do what. Every member is equal today. Roles must exist on users first, with a first superadmin, before any admin feature can be built.

## What Changes

- Every user has one of three roles: `user`, `admin` or `superadmin`. A member without a given role is a `user`, so everything that exists today stays user-level.
- A superadmin can give and take away the admin role, and can do everything an admin can. An admin can do admin things, a user only user things.
- The first superadmin is chosen by configuration: the email in the `SUPERADMIN_EMAIL` variable (`info@rhythm-coder.dev`). When a member is created at the welcome screen with that email (letter case ignored) and no superadmin exists yet, they become `superadmin`. Everyone else becomes `user`.
- The role of a user can be read in code, so later changes can use it.
- Out of scope: any admin feature, any screen to change roles, and checking roles on pages or data endpoints. Nothing is refused or hidden yet. A member who already has a user record is not promoted by this rule.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `users`: a user has a role; the configured first superadmin; what each role is allowed to do.

## Impact

- New migration `packages/web/migrations/0006_roles.sql`: `users.role` column.
- `packages/web/wrangler.jsonc`: new `SUPERADMIN_EMAIL` variable.
- `packages/web/app/.server/users.ts`: `User` gets a `role`; `createUser` takes the configured email and sets the role. The welcome route passes `env.SUPERADMIN_EMAIL`.
- Tests in `migrations.test.ts` and `users.test.ts`.
- `info@rhythm-coder.dev` must also be on the family allowlist (Cloudflare Access, outside this repo), or the superadmin cannot sign in.
