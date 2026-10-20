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
