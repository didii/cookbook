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
