# Design

## Context

`users` rows are made when a member submits the welcome screen, and `calling_name` is `NOT NULL`: a row only exists after the member has been welcomed. See proposal.md for the why.

## Goals / Non-Goals

**Goals:**
- Store a role per member, default `user`.
- Make the configured first member superadmin when they are welcomed.
- Expose the role on `User` for later changes.

**Non-Goals:**
- Role checks, admin features, a role-changing screen, any rule on who may change roles. All come later.
- Promoting a member who already has a user record.

## Decisions

**The role is a column on `users`: `role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin'))`.** A role only means something for a member, and the scope is small, so no separate table. The default gives every existing member `user` without a data change, and the `CHECK` refuses unknown roles. `getUser` reads the column directly.

**No data in the migration; the superadmin is decided when a user is created.** A Worker has no startup hook with database access, and a hardcoded seed in a migration puts a row in every database (and every test), cannot be configured, and cannot be recovered when removed. Instead `createUser(db, email, callingName, superadminEmail)` takes the configured email as a parameter (the welcome route passes `env.SUPERADMIN_EMAIL`, so the function does not read the environment itself) and sets the role in the same `INSERT`: `superadmin` iff the email equals `superadminEmail` (`COLLATE NOCASE`) and `NOT EXISTS (SELECT 1 FROM users WHERE role = 'superadmin')`, else `user`. It is one statement, so two concurrent creations cannot both become superadmin. The member still sees the welcome screen and types their own calling name. An empty or missing `superadminEmail` promotes nobody.

**`SUPERADMIN_EMAIL` is a `vars` entry in `wrangler.jsonc`** next to `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD`; `wrangler types` generates its type. It is not a secret.

**`User.role` is a union type `'user' | 'admin' | 'superadmin'`.** No helper such as `can()` yet: without a caller it is speculative. The later change that first checks roles adds it.

**Migration `0006_roles.sql`.** Next number after `0005_recipe_views.sql`. `ALTER TABLE ... ADD COLUMN` with a constant default is allowed in SQLite, with a `CHECK` and `NOT NULL`.

## Risks / Trade-offs

- Configured email is not on the Cloudflare Access allowlist → the superadmin cannot sign in. Mitigation: add it there before or with deploying; noted in tasks.
- A member who already has a `users` row before this ships is not promoted by the rule, since the rule only runs on creation. Recovery for that, or for a lost superadmin, is a manual database update for now. If the superadmin's row is deleted, they are promoted again when they re-welcome (while no other superadmin exists).
