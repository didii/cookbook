# Design

## Context

`users` rows are made when a member submits the welcome screen, and `calling_name` is `NOT NULL`: a row only exists after the member has been welcomed. See proposal.md for the why.

## Goals / Non-Goals

**Goals:**
- Store a role per member, default `user`, with the first superadmin seeded by migration.
- Expose the role on `User` for later changes.

**Non-Goals:**
- Role checks, admin features, a role-changing screen, any rule on who may change roles. All come later.

## Decisions

**Roles live in their own table, keyed by email, not in a column on `users`.** The seed must exist before the superadmin has ever signed in, but a `users` row needs a calling name that only the person can give. A placeholder name would skip the welcome screen and give a wrong name. A table `roles (email TEXT PRIMARY KEY COLLATE NOCASE, role TEXT NOT NULL CHECK (role IN ('admin', 'superadmin')))` holds only elevated roles; no row means `user`. The migration inserts `info@rhythm-coder.dev` as `superadmin`. `getUser` does a `LEFT JOIN` and returns `role` as `COALESCE(roles.role, 'user')`. The `CHECK` refuses unknown roles; `user` is never stored, so it cannot go out of step.
- Alternative: `users.role` column plus a seeded `users` row with a placeholder calling name. Rejected: breaks the welcome screen for the superadmin.
- Alternative: `users.role` nullable-name row. Rejected: relaxes `calling_name`, which touches welcome and all readers.
- Alternative: promote by code on welcome when the email matches a constant. Rejected: the user wanted the seed in migrations, and it hides a data fact in code.

**`User.role` is a union type `'user' | 'admin' | 'superadmin'`.** No helper such as `can()` yet: without a caller it is speculative. The later change that first checks roles adds it.

**Migration `0006_roles.sql`.** Next number after `0005_recipe_views.sql`. Existing users need no data change.

## Risks / Trade-offs

- Seeded email is not on the Cloudflare Access allowlist → superadmin cannot sign in. Mitigation: add it there before or with deploying; noted in tasks.
- Seeded address is fixed in a migration; changing the superadmin later needs a new migration or a (future) admin screen. Accepted.
- A role row survives if a `users` row is ever deleted. Accepted: it follows the email, not the row.
