import { data } from 'react-router';
import type { Role } from '~/lib/role';

export type { Role };
export type User = { id: number; email: string; callingName: string; createdAt: string; role: Role };

/** The member with this email (letter case does not matter), if they have been welcomed (or seeded) before. */
export async function getUser(db: D1Database, email: string): Promise<User | undefined> {
  return (
    (await db
      .prepare('SELECT id, email, calling_name AS callingName, created_at AS createdAt, role FROM users WHERE email = ?')
      .bind(email)
      .first<User>()) ?? undefined
  );
}

/**
 * Stores the member. Idempotent: when the email already has a row (in any letter case), nothing changes and the first calling name stays.
 * The member becomes `superadmin` when their email is `superadminEmail` (letter case does not matter) and no superadmin exists yet; otherwise `user`.
 * One statement, so two members cannot both become superadmin.
 */
export async function createUser(db: D1Database, email: string, callingName: string, superadminEmail?: string): Promise<void> {
  await db
    .prepare(
      `INSERT INTO users (email, calling_name, role) VALUES (?1, ?2,
         CASE WHEN ?3 <> '' AND ?1 = ?3 COLLATE NOCASE AND NOT EXISTS (SELECT 1 FROM users WHERE role = 'superadmin') THEN 'superadmin' ELSE 'user' END)
       ON CONFLICT (email) DO NOTHING`,
    )
    .bind(email, callingName, superadminEmail ?? '')
    .run();
}

/** The member, when their role is `admin` or `superadmin`; otherwise throws a 403 response. Check this first in the loader and action of every admin page: hiding a link is not protection. */
export async function requireAdmin(db: D1Database, email: string): Promise<User> {
  const user = await getUser(db, email);
  if (user?.role !== 'admin' && user?.role !== 'superadmin') throw data('Geen toegang', { status: 403 });
  return user;
}

/** The member, when their role is `superadmin`; otherwise throws a 403 response. Check this first in the loader and action of every user management route: hiding a link is not protection. */
export async function requireSuperadmin(db: D1Database, email: string): Promise<User> {
  const user = await getUser(db, email);
  if (user?.role !== 'superadmin') throw data('Geen toegang', { status: 403 });
  return user;
}

/** At most this many users are listed on the user management page. */
export const userLimit = 100;

export type UserListItem = Pick<User, 'id' | 'email' | 'callingName' | 'role'>;

/** The first `limit` users by email (letter case ignored); `capped` tells there are more. Fetches one extra row to know, so no COUNT. */
export async function listUsers(db: D1Database, limit = userLimit): Promise<{ users: UserListItem[]; capped: boolean }> {
  const { results } = await db
    .prepare('SELECT id, email, calling_name AS callingName, role FROM users ORDER BY email COLLATE NOCASE LIMIT ?')
    .bind(limit + 1)
    .all<UserListItem>();
  return { users: results.slice(0, limit), capped: results.length > limit };
}

/** The member with this id, if any. */
export async function getUserById(db: D1Database, id: number): Promise<User | undefined> {
  return (
    (await db
      .prepare('SELECT id, email, calling_name AS callingName, created_at AS createdAt, role FROM users WHERE id = ?')
      .bind(id)
      .first<User>()) ?? undefined
  );
}

/** Whether this member is the only superadmin. */
export async function isLastSuperadmin(db: D1Database, user: User): Promise<boolean> {
  if (user.role !== 'superadmin') return false;
  return !(await db.prepare("SELECT 1 FROM users WHERE role = 'superadmin' AND id <> ?").bind(user.id).first());
}

/**
 * Changes the calling name and, when `role` is given, the role. Returns whether a row changed: false when there is no such user, or when the change
 * would leave no superadmin. The guard sits in the one statement, so two superadmins demoting each other at once cannot both succeed.
 */
export async function updateUser(db: D1Database, id: number, { callingName, role }: { callingName: string; role?: Role }): Promise<boolean> {
  const result = await db
    .prepare(
      `UPDATE users SET calling_name = ?1, role = COALESCE(?2, role)
       WHERE id = ?3 AND (role <> 'superadmin' OR COALESCE(?2, role) = 'superadmin'
         OR EXISTS (SELECT 1 FROM users WHERE role = 'superadmin' AND id <> ?3))`,
    )
    .bind(callingName, role ?? null, id)
    .run();
  return result.meta.changes > 0;
}

/** Deletes the member (their recipe views go with them by cascade). Returns whether a row was deleted: false when there is no such user or they are the only superadmin. */
export async function deleteUser(db: D1Database, id: number): Promise<boolean> {
  const result = await db
    .prepare(
      `DELETE FROM users WHERE id = ?1 AND (role <> 'superadmin'
         OR EXISTS (SELECT 1 FROM users WHERE role = 'superadmin' AND id <> ?1))`,
    )
    .bind(id)
    .run();
  return result.meta.changes > 0;
}
