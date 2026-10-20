import { redirect } from 'react-router';
import { welcomePath } from '~/lib/returnUrl';

export type User = { id: number; email: string; callingName: string; createdAt: string };

/** The member with this email (letter case does not matter), if they have been welcomed before. */
export async function getUser(db: D1Database, email: string): Promise<User | undefined> {
  return (
    (await db
      .prepare('SELECT id, email, calling_name AS callingName, created_at AS createdAt FROM users WHERE email = ?')
      .bind(email)
      .first<User>()) ?? undefined
  );
}

/** Stores the member. Idempotent: when the email already has a row (in any letter case), nothing changes and the first calling name stays. */
export async function createUser(db: D1Database, email: string, callingName: string): Promise<void> {
  await db.prepare('INSERT INTO users (email, calling_name) VALUES (?, ?) ON CONFLICT (email) DO NOTHING').bind(email, callingName).run();
}

/** A redirect to the welcome screen, remembering the requested page and query, for a member without a user row asking for any other page; otherwise nothing. */
export async function redirectToWelcome(db: D1Database, email: string, url: URL): Promise<Response | undefined> {
  if (url.pathname === welcomePath || (await getUser(db, email))) return undefined;
  return redirect(`${welcomePath}?${new URLSearchParams({ returnUrl: url.pathname + url.search })}`);
}
