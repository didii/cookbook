import { expiryFor, stored, type ExpiryChoice } from './shareExpiry';

export type Share = { token: string; expiresAt: string | null };

/** 128 random bits as base64url (22 characters). Not derived from the recipe or the member. */
function newToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

/**
 * The member's share of the recipe, created when there is none. A share that has expired is replaced by one with a new token and no end date, so the old link stays dead.
 * One upsert statement plus a select in one batch, so two quick calls cannot make two tokens. `created` tells whether this call made (or replaced) the share.
 * Returns undefined for an unknown recipe or member.
 */
export async function getOrCreateShare(
  db: D1Database,
  email: string,
  slug: string,
  now = new Date(),
): Promise<(Share & { created: boolean }) | undefined> {
  const at = stored(now);
  const [upsert, select] = await db.batch<{ token: string; expiresAt: string | null }>([
    db
      .prepare(
        `INSERT INTO recipe_shares (token, recipe_id, user_id, expires_at, created_at)
         SELECT ?1, r.id, u.id, NULL, ?2 FROM recipes r, users u WHERE r.slug = ?3 AND u.email = ?4
         ON CONFLICT (recipe_id, user_id) DO UPDATE SET token = excluded.token, expires_at = NULL, created_at = excluded.created_at
         WHERE recipe_shares.expires_at IS NOT NULL AND recipe_shares.expires_at <= ?2`,
      )
      .bind(newToken(), at, slug, email),
    db
      .prepare(
        `SELECT token, expires_at AS expiresAt FROM recipe_shares
         WHERE recipe_id = (SELECT id FROM recipes WHERE slug = ?1) AND user_id = (SELECT id FROM users WHERE email = ?2)`,
      )
      .bind(slug, email),
  ]);
  const share = select!.results[0];
  return share && { ...share, created: upsert!.meta.changes > 0 };
}

/** Stores the end date of the member's own live share of the recipe: `choice` counted from `now`, or none for "never". Returns undefined when the member has no live share of it. */
export async function setShareExpiry(
  db: D1Database,
  email: string,
  slug: string,
  choice: ExpiryChoice,
  now = new Date(),
): Promise<{ expiresAt: string | null } | undefined> {
  const expiresAt = expiryFor(choice, now);
  const result = await db
    .prepare(
      `UPDATE recipe_shares SET expires_at = ?1
       WHERE recipe_id = (SELECT id FROM recipes WHERE slug = ?2) AND user_id = (SELECT id FROM users WHERE email = ?3)
         AND (expires_at IS NULL OR expires_at > ?4)`,
    )
    .bind(expiresAt, slug, email, stored(now))
    .run();
  return result.meta.changes > 0 ? { expiresAt } : undefined;
}
