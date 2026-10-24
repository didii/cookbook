## Why

Roles exist (`users.role`) but nothing can change a user, and a user record cannot be removed. The superadmin has to edit the database by hand to fix a calling name, give someone the admin role, or remove a member who left. Card #42: a user management page, for the superadmin only.

## What Changes

- New page `/beheer/gebruikers`, in the site header layout, reachable only by a `superadmin`. A simple master/detail view on one page: the list of all users, sorted by email ascending, sits on top; selecting one shows a form below it to change that user. Without a selection only the list is shown.
- The detail form edits the calling name and the role (`user`, `admin`, `superadmin`). The email is shown but not editable. Buttons: "Opslaan" (save), "Herstel" (reset the form to the stored values) and "Verwijderen" (delete, behind a confirmation popup like `delete-recipe`). One user at a time; no bulk edit, filtering or paging.
- Safety limit: the page loads at most 100 users. When there are more, it shows that the list is capped at 100.
- The cookbook always keeps at least one superadmin: a role change or deletion that would leave none is refused. A superadmin can promote others, and can demote or delete themselves while another superadmin exists. Demoting yourself first shows a warning popup that you lose access to this page.
- The sidebar gets a link "Gebruikers", shown only to a `superadmin`.
- The page's server requests (loaders and actions) are refused with HTTP 403 for anyone who is not a `superadmin`. Hiding the link is not the protection.
- Deleting a user removes their record and their recipe views (database cascade). Recipes stay. Out of scope: removing someone from the family allowlist (Cloudflare Access). A deleted member who can still sign in is welcomed again and asks for a calling name. The delete popup says so and links to the Cloudflare Access dashboard where the allowlist is managed (URL from a config variable, placeholder for now).
- Out of scope: creating users (they arrive via the welcome screen), changing the email, bulk actions, filtering, paging, audit history.

## Capabilities

### New Capabilities

- `user-management`: the superadmin-only page that lists, edits and deletes users, the 100-user cap, and the access rule.

### Modified Capabilities

- `site-menu`: the sidebar also lists "Gebruikers" for a `superadmin`, after "Herkenning".
- `users`: a `superadmin` may set any role (including `superadmin`) and delete members; the user management page is refused to non-superadmins.

## Impact

- `.server/users.ts`: `requireSuperadmin`, `listUsers` (cap), `updateUser`, `deleteUser`.
- New routes `routes/admin-users/route.tsx` (master, loader) and `routes/admin-users/user/route.tsx` (detail, loader and action), plus components beside them; `routes.ts`.
- `shared/SiteMenu.tsx` gets one more role-gated entry; the root loader, `Header` and the layout already pass the role (from `configure-parsing-rules`).
- `wrangler.jsonc`: new variable `CLOUDFLARE_ACCESS_URL` (placeholder `https://one.dash.cloudflare.com/` until the exact policy link is filled in).
- No migration, no new dependency.
- Builds on `configure-parsing-rules` (role from the root loader, `SiteMenu` `role` prop, `Role` type); its delta specs for `site-menu` and `users` are modified again here.
