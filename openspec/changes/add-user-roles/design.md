# Design

## Context

`users` rows are made when a member submits the welcome screen, and `calling_name` is `NOT NULL`: a row normally only exists after the member has been welcomed. See proposal.md for the why.

## Goals / Non-Goals

**Goals:**
- Store a role per member, default `user`, with the first superadmin seeded by migration.
- Expose the role on `User` for later changes.

**Non-Goals:**
- Role checks, admin features, a role-changing screen, any rule on who may change roles. All come later.

## Decisions

**The role is a column on `users`: `role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin'))`.** A role only means something for a member, and the scope is small, so no separate table. The default gives every existing member `user` without a data change, and the `CHECK` refuses unknown roles. `getUser` reads the column directly.
- Alternative: separate `roles` table keyed by email (an earlier version of this change). Rejected: a role has no use without a user, and it needed a `LEFT JOIN` and `COALESCE` for no gain.

**The superadmin is seeded as a user.** The migration upserts `info@rhythm-coder.dev` with calling name `Dieter` and role `superadmin`: `INSERT ... ON CONFLICT (email) DO UPDATE SET role = 'superadmin'`. The seeded row already satisfies `calling_name NOT NULL`, so the person never sees the welcome screen (intended). If they had already signed in, the conflict branch promotes them and keeps their calling name. `users.email` is `COLLATE NOCASE`, so letter case does not matter.

**`User.role` is a union type `'user' | 'admin' | 'superadmin'`.** No helper such as `can()` yet: without a caller it is speculative. The later change that first checks roles adds it.

**Migration `0006_roles.sql`.** Next number after `0005_recipe_views.sql`. `ALTER TABLE ... ADD COLUMN` with a constant default is allowed in SQLite, with a `CHECK` and `NOT NULL`.

## Risks / Trade-offs

- Seeded email is not on the Cloudflare Access allowlist → superadmin cannot sign in. Mitigation: add it there before or with deploying; noted in tasks.
- Seeded address and name are fixed in a migration; changing the superadmin later needs a new migration or a (future) admin screen. Accepted.
