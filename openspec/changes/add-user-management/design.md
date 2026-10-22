# Design

## Context

Observed: `configure-parsing-rules` has put `role` in the root loader (one `getUser` per navigation), passed it layout -> `Header` -> `SiteMenu` as a `role` prop, and added `requireAdmin` and the `Role` type to `.server/users.ts`. `users` has `id`, `email` (unique, case-insensitive), `calling_name` (non-blank check), `created_at` and `role` (checked). `recipe_views.user_id` cascades on user delete, so deleting the `users` row is enough. `.server/users.ts` has `getUser`, `createUser` and `requireAdmin`. `userEmailContext` holds the verified email. Routes sit under `layout(...)` in `routes.ts`; the root loader returns `{ email, role, rules }`; `SiteMenu` has a `links` list with an `admin` flag. See proposal.md for the why.

## Goals / Non-Goals

**Goals:**
- A superadmin can list, edit (calling name, role) and delete users on one page.
- The server enforces the access rule; the UI only hides the link.
- A hard cap on rows loaded, shown on the page when hit.

**Non-Goals:** see proposal.md (create, email change, bulk, filter, paging, allowlist, audit).

## Decisions

**Two nested routes for master/detail, on one page.** `beheer/gebruikers` is the master (list on top, cap message, `<Outlet />` below the list); it has no index child, so without a selection the outlet is empty and only the list shows; `beheer/gebruikers/:id` is the detail (form, rendered below the list). The selection is the URL, so it survives a reload and the back button, and the master's loader does not rerun just because the selection changed (React Router skips unchanged parents). Alternative: one route with `?id=`; rejected because each route would need both loader and action logic mixed. Selected entry uses `NavLink` (`aria-current="page"`), styled from that state. The stacked layout is the same on every width.

**`requireSuperadmin(db, email)` in `.server/users.ts`.** Throws a 403 `Response` unless the user's role is `superadmin`; returns the user. Called first in the loader of the master and in the loader and action of the detail, because loaders of parent and child run in parallel and a child must not rely on its parent. The email comes from `userEmailContext` (verified by the Worker), never from the request body.

**Cap: fetch `LIMIT 101`, show 100.** `listUsers(db, limit = 100)` selects `id, email, calling_name, role ORDER BY email COLLATE NOCASE LIMIT limit + 1` and returns `{ users: first limit, capped: rows > limit }`. Fetching one extra tells "exactly 100" from "more than 100" without a `COUNT`. The page shows "Er zijn meer dan 100 gebruikers; alleen de eerste 100 worden getoond." when `capped`. The limit is a constant `userLimit` in `.server/users.ts`.

**Detail form posts to its own route.** One `<Form method="post">` with fields `callingName` and `role`,; the user id is the URL param, not a form field. `updateUser(db, id, { callingName, role })` does `UPDATE ... SET calling_name = ?, role = COALESCE(?, role) WHERE id = ?` (`role` undefined keeps the stored role) and returns whether a row matched (404 otherwise). Validation in the action: trim the calling name, refuse blank with a 400 and message "Vul een roepnaam in."; role must be one of the three, else 400. The DB `CHECK` stays the backstop. After a save the action returns nothing special; React Router revalidates the loaders, so the list and form show stored values.

**Reset is a native `<button type="reset">`.** Fields are uncontrolled with `defaultValue` from the loader, so the browser restores them. The form has `key={user.id}` so selecting another user remounts it with fresh defaults. No state code.

**Delete uses a second form and a modal `<dialog>`**, the same shape as `DeleteRecipe` (native `showModal()`, backdrop click closes, "Annuleren"). It posts `intent=delete` to the same action; the action checks `intent` (`save` is the default). On success `redirect('/beheer/gebruikers')`, or `redirect('/')` when the superadmin deleted their own record (they no longer have a user row, so the welcome screen shows). `deleteUser(db, id)` is `DELETE FROM users WHERE id = ?`, returning whether a row matched. Component `DeleteUser.tsx` beside the detail route, not shared with `DeleteRecipe`: the texts and contract differ and a shared abstraction for two dialogs is premature.

**Always one superadmin, enforced in SQL.** The rule is about the cookbook, not about "self": any change that would leave no superadmin is refused. `updateUser` and `deleteUser` carry the guard inside their one statement, e.g. `UPDATE users SET ... WHERE id = ? AND (role <> 'superadmin' OR ?newRole = 'superadmin' OR EXISTS (SELECT 1 FROM users WHERE role = 'superadmin' AND id <> ?))` and the same `EXISTS` for `DELETE`. One statement means two superadmins demoting each other at once cannot both succeed. They return whether a row changed; the action tells "no such user" (404) from "refused" (400) by checking the user exists first. The detail loader returns `lastSuperadmin` (the target is a superadmin and no other exists) so the form can disable the role select and "Verwijderen" for them. Each disabled control gets a short visible reason right beside it (small text, linked with `aria-describedby`): "De rol van de enige superadmin kan niet worden gewijzigd" and "De enige superadmin kan niet worden verwijderd". No tooltip: a disabled button gets no hover or focus events on touch devices; a disabled field is not submitted, so a missing `role` means "unchanged". Promoting others and demoting or deleting yourself while another superadmin exists are allowed.

**Demote-yourself warning.** When the target is the signed-in superadmin and the chosen role is not `superadmin`, "Opslaan" opens a modal `<dialog>` (same shape as `DeleteRecipe`: `showModal()`, "Annuleren", Escape, backdrop click) saying they lose access to this page; its confirm button submits the form. Otherwise "Opslaan" submits directly. This is a client convenience; the server does not need the popup. After a successful self-demotion the action redirects to `/`, since the page would now answer 403. The delete popup for your own record uses the same warning text.

**Menu link.** `SiteMenu` already gets the `role` prop; its `links` list gets `{ to: '/beheer/gebruikers', label: 'Gebruikers', superadmin: true }` after "Herkenning", shown only when `role === 'superadmin'`. The existing `admin` flag keeps working (`admin` entries show for admin and superadmin). Nothing changes in the root loader, layout or `Header`. The `Role` type from `.server/users.ts` is reused for the form's role values.

**Dutch labels, no new dependency, no migration.** Page title "Gebruikers · Familiekookboek". `CLOUDFLARE_ACCESS_URL` is read from `context.get(envContext)`; tests build `Env` with `fake<Env>`, so the loader test sets it explicitly.

## Risks / Trade-offs

- A deleted member who is still on the Cloudflare Access allowlist signs in, is welcomed again and becomes a `user` again (or the first superadmin if the configured rule applies and no superadmin exists). Removing someone for good also means removing them from the allowlist, outside this repo. The delete popup says: "Hij of zij kan opnieuw inloggen zolang het e-mailadres op de toegestane lijst staat." with a link "Beheer de lijst in Cloudflare" to `CLOUDFLARE_ACCESS_URL`, a `vars` entry in `wrangler.jsonc` (like `SUPERADMIN_EMAIL`), returned by the detail loader. The value is a placeholder (`https://one.dash.cloudflare.com/`, the Zero Trust dashboard start page) until the exact policy link is known; `docs/add-family-member.md` describes the path (Access > Policies).
- Two superadmins editing the same user: last save wins, except the superadmin guard above. Accepted at <10 users.
- Stacked on `configure-parsing-rules`: it must be merged first.
- Superadmins can demote each other. Accepted: both are trusted, and the SQL guard keeps at least one.
- The cap hides users beyond 100 with no way to reach them in the UI. Accepted for the expected size; the message tells.
