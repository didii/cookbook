import type { Recipe, RecipeIngredient, RecipeSummary, Step, StepQuantity } from './recipe';
import { pickSeal } from './seals';
import { compareTags, sortTags } from './tags';

export type RecipeRow = {
  id: number;
  slug: string;
  title: string;
  author: string;
  time: string | null;
  servings: number | null;
  intro: string;
  image: string | null;
  source: string | null;
  seal: string | null;
  /** When the recipe was last saved; the editor compares it to the version a draft started from. */
  updated_at: string;
};

/** A step to store: its text, and any ingredient chips, oven temperature and timer. */
export type StepInput = Pick<Step, 'body'> & Partial<Step>;

type StepRow = { id: number; body: string; oven_temperature: number | null; timer_minutes: number | null; timer_label: string | null };

/** One round trip (a single batch): the recipe plus its ingredients and steps (with their chips) in stored order. */
export async function getRecipe(db: D1Database, slug: string): Promise<Recipe | undefined> {
  const [recipe, ingredients, steps, chips, quantities, tags] = await db.batch([
    db.prepare('SELECT id, slug, title, author, time, servings, intro, image, source, seal, updated_at FROM recipes WHERE slug = ?').bind(slug),
    db
      .prepare(
        'SELECT i.quantity_text AS quantityText, i.quantity_value AS quantityValue, i.quantity_value_max AS quantityValueMax, i.quantity_unit AS quantityUnit, i.name FROM ingredients i JOIN recipes r ON r.id = i.recipe_id WHERE r.slug = ? ORDER BY i.position',
      )
      .bind(slug),
    db
      .prepare(
        'SELECT s.id, s.body, s.oven_temperature, s.timer_minutes, s.timer_label FROM steps s JOIN recipes r ON r.id = s.recipe_id WHERE r.slug = ? ORDER BY s.position',
      )
      .bind(slug),
    db
      .prepare(
        'SELECT c.step_id, c.quantity_text AS quantityText, c.quantity_value AS quantityValue, c.quantity_value_max AS quantityValueMax, c.quantity_unit AS quantityUnit, c.name FROM step_ingredient_chips c JOIN steps s ON s.id = c.step_id JOIN recipes r ON r.id = s.recipe_id WHERE r.slug = ? ORDER BY s.position, c.position',
      )
      .bind(slug),
    db
      .prepare(
        'SELECT q.step_id, q.start_index AS startIndex, q.end_index AS endIndex, q.quantity_value AS quantityValue, q.quantity_value_max AS quantityValueMax, q.max_start_index AS maxStartIndex, q.max_end_index AS maxEndIndex, q.quantity_unit AS quantityUnit FROM step_quantities q JOIN steps s ON s.id = q.step_id JOIN recipes r ON r.id = s.recipe_id WHERE r.slug = ? ORDER BY q.start_index',
      )
      .bind(slug),
    db.prepare('SELECT t.name FROM recipe_tags rt JOIN tags t ON t.id = rt.tag_id JOIN recipes r ON r.id = rt.recipe_id WHERE r.slug = ?').bind(slug),
  ]);
  const row = (recipe.results as RecipeRow[])[0];
  if (!row) return undefined;
  const chipRows = chips.results as (RecipeIngredient & { step_id: number })[];
  const quantityRows = quantities.results as (StepQuantity & { step_id: number })[];
  return {
    ...row,
    tags: sortTags((tags.results as { name: string }[]).map((t) => t.name)),
    ingredients: ingredients.results as RecipeIngredient[],
    steps: (steps.results as StepRow[]).map((s) => ({
      body: s.body,
      ingredients: chipRows
        .filter((c) => c.step_id === s.id)
        .map((c) => ({
          quantityText: c.quantityText,
          quantityValue: c.quantityValue,
          quantityValueMax: c.quantityValueMax,
          quantityUnit: c.quantityUnit,
          name: c.name,
        })),
      quantities: quantityRows
        .filter((q) => q.step_id === s.id)
        .map((q) => ({
          startIndex: q.startIndex,
          endIndex: q.endIndex,
          quantityValue: q.quantityValue,
          quantityValueMax: q.quantityValueMax,
          maxStartIndex: q.maxStartIndex,
          maxEndIndex: q.maxEndIndex,
          quantityUnit: q.quantityUnit,
        })),
      ovenTemperature: s.oven_temperature ?? undefined,
      timer: s.timer_minutes === null ? undefined : { minutes: s.timer_minutes, label: s.timer_label ?? undefined },
    })),
  };
}

export type RecipeInput = {
  title: string;
  author: string;
  servings?: number;
  time?: string;
  intro?: string;
  image?: string;
  /** Where the recipe came from; blank is stored as none. */
  source?: string;
  seal?: string;
  createdBy?: string;
  ingredients?: { name: string; quantityText?: string; quantityValue?: number; quantityValueMax?: number; quantityUnit?: string }[];
  steps?: StepInput[];
  /** Tag names; a name matching a stored tag (letter case ignored) uses that tag, any other is created. */
  tags?: string[];
};

/** Addresses that are routes of their own and so can't be a recipe slug. */
const reservedSlugs = ['nieuw'];

/** "Kip met Rijst!" -> "kip-met-rijst". Never empty. */
export function slugify(title: string): string {
  const slug = title
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return slug || 'recept';
}

/** The first of base, base-2, base-3, … that no recipe has and that isn't reserved. */
async function freeSlug(db: D1Database, title: string): Promise<string> {
  const base = slugify(title);
  const { results } = await db.prepare("SELECT slug FROM recipes WHERE slug = ? OR slug LIKE ? || '-%'").bind(base, base).all<{ slug: string }>();
  const taken = new Set([...results.map((r) => r.slug), ...reservedSlugs]);
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) if (!taken.has(`${base}-${n}`)) return `${base}-${n}`;
}

/** A random one of the least used seals. */
export async function chooseSeal(db: D1Database): Promise<string> {
  const { results } = await db
    .prepare('SELECT seal, COUNT(*) AS count FROM recipes WHERE seal IS NOT NULL GROUP BY seal')
    .all<{ seal: string; count: number }>();
  return pickSeal(results);
}

/** Statements that store the steps (with their chips and amounts) of the recipe with this slug, at the places 0, 1, …; none if there is no such recipe. */
function insertSteps(db: D1Database, slug: string, steps: StepInput[]) {
  return steps.flatMap((step, i) => [
    db
      .prepare(
        'INSERT INTO steps (recipe_id, position, body, oven_temperature, timer_minutes, timer_label) SELECT id, ?, ?, ?, ?, ? FROM recipes WHERE slug = ?',
      )
      .bind(i, step.body, step.ovenTemperature ?? null, step.timer?.minutes ?? null, step.timer?.label ?? null, slug),
    ...(step.ingredients ?? []).map((chip, j) =>
      db
        .prepare(
          'INSERT INTO step_ingredient_chips (step_id, position, quantity_text, quantity_value, quantity_value_max, quantity_unit, name) SELECT s.id, ?, ?, ?, ?, ?, ? FROM steps s JOIN recipes r ON r.id = s.recipe_id WHERE r.slug = ? AND s.position = ?',
        )
        .bind(j, chip.quantityText, chip.quantityValue ?? null, chip.quantityValueMax ?? null, chip.quantityUnit ?? null, chip.name, slug, i),
    ),
    ...(step.quantities ?? []).map((q) =>
      db
        .prepare(
          'INSERT INTO step_quantities (step_id, start_index, end_index, quantity_value, quantity_value_max, max_start_index, max_end_index, quantity_unit) SELECT s.id, ?, ?, ?, ?, ?, ?, ? FROM steps s JOIN recipes r ON r.id = s.recipe_id WHERE r.slug = ? AND s.position = ?',
        )
        .bind(
          q.startIndex,
          q.endIndex,
          q.quantityValue,
          q.quantityValueMax ?? null,
          q.maxStartIndex ?? null,
          q.maxEndIndex ?? null,
          q.quantityUnit,
          slug,
          i,
        ),
    ),
  ]);
}

/** Statements that link the recipe with this slug to the given tags, creating unknown ones. Blanks and case-insensitive duplicates are dropped; a stored tag keeps its spelling. */
function insertTags(db: D1Database, slug: string, tags: string[]) {
  const names = new Map<string, string>();
  for (const t of tags.map((t) => t.trim())) if (t && !names.has(t.toLowerCase())) names.set(t.toLowerCase(), t);
  return [...names.values()].flatMap((name) => [
    db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)').bind(name),
    db
      .prepare('INSERT OR IGNORE INTO recipe_tags (recipe_id, tag_id) SELECT r.id, t.id FROM recipes r, tags t WHERE r.slug = ? AND t.name = ?')
      .bind(slug, name),
  ]);
}

/** Stores a recipe with its ingredients and steps in one batch and returns its slug. */
export async function createRecipe(db: D1Database, recipe: RecipeInput): Promise<string> {
  const slug = await freeSlug(db, recipe.title);
  const seal = recipe.seal ?? (await chooseSeal(db));
  const idOf = '(SELECT id FROM recipes WHERE slug = ?)';
  await db.batch([
    db
      .prepare(
        // A case variant of a stored author takes the stored spelling.
        'INSERT INTO recipes (slug, title, author, servings, time, intro, image, source, seal, created_by) VALUES (?, ?, COALESCE((SELECT author FROM recipes WHERE author = ? COLLATE NOCASE LIMIT 1), ?), ?, ?, ?, ?, ?, ?, ?)',
      )
      .bind(
        slug,
        recipe.title,
        recipe.author,
        recipe.author,
        recipe.servings ?? null,
        recipe.time ?? null,
        recipe.intro ?? '',
        recipe.image ?? null,
        recipe.source?.trim() || null,
        seal,
        recipe.createdBy ?? null,
      ),
    ...(recipe.ingredients ?? []).map((ing, i) =>
      db
        .prepare(
          `INSERT INTO ingredients (recipe_id, position, name, quantity_text, quantity_value, quantity_value_max, quantity_unit) VALUES (${idOf}, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(slug, i, ing.name, ing.quantityText ?? '', ing.quantityValue ?? null, ing.quantityValueMax ?? null, ing.quantityUnit ?? null),
    ),
    ...insertSteps(db, slug, recipe.steps ?? []),
    ...insertTags(db, slug, recipe.tags ?? []),
  ]);
  return slug;
}

/** A recipe is "new" to a member for this many months after it was added. */
export const newForMonths = 1;

/** Every recipe, the most recently added first, with its tags (most used first), each flagged `isNew` for this member: added less than `newForMonths` before `now`, not opened by them and not added by them. */
export async function listRecipes(db: D1Database, email: string, now: Date): Promise<RecipeSummary[]> {
  const cutoff = new Date(now);
  cutoff.setUTCMonth(cutoff.getUTCMonth() - newForMonths);
  const { results } = await db
    .prepare(
      `SELECT r.slug, r.title, r.author, r.time, r.image, r.seal,
        EXISTS (SELECT 1 FROM recipe_likes l WHERE l.recipe_id = r.id AND l.user_id = u.id) AS liked,
        EXISTS (SELECT 1 FROM recipe_notes n WHERE n.recipe_id = r.id AND n.user_id = u.id) AS hasNote,
        (r.created_at > ?1 AND v.recipe_id IS NULL AND COALESCE(r.created_by <> ?2 COLLATE NOCASE, 1)) AS isNew,
        (SELECT json_group_array(json_object('name', t.name, 'uses', (SELECT COUNT(*) FROM recipe_tags x WHERE x.tag_id = t.id))) FROM recipe_tags rt JOIN tags t ON t.id = rt.tag_id WHERE rt.recipe_id = r.id) AS tags
      FROM recipes r
      LEFT JOIN users u ON u.email = ?2
      LEFT JOIN recipe_views v ON v.recipe_id = r.id AND v.user_id = u.id
      ORDER BY r.id DESC`,
    )
    .bind(cutoff.toISOString().replace(/\.\d+Z$/, 'Z'), email)
    .all<Omit<RecipeSummary, 'isNew' | 'tags' | 'liked' | 'hasNote'> & { isNew: 0 | 1; liked: 0 | 1; hasNote: 0 | 1; tags: string }>();
  return results.map((r) => ({
    ...r,
    isNew: r.isNew === 1,
    liked: r.liked === 1,
    hasNote: r.hasNote === 1,
    tags: (JSON.parse(r.tags) as { name: string; uses: number }[]).sort((a, b) => b.uses - a.uses || compareTags(a.name, b.name)).map((t) => t.name),
  }));
}

/** The names of the ingredients of every recipe with any, by slug, in recipe order. */
export async function listIngredientNames(db: D1Database): Promise<Record<string, string[]>> {
  const { results } = await db
    .prepare('SELECT r.slug, i.name FROM ingredients i JOIN recipes r ON r.id = i.recipe_id ORDER BY i.recipe_id, i.position')
    .all<{ slug: string; name: string }>();
  const names: Record<string, string[]> = {};
  for (const { slug, name } of results) (names[slug] ??= []).push(name);
  return names;
}

/** Every stored tag, alphabetical, for suggestions. */
export async function listTags(db: D1Database): Promise<string[]> {
  const { results } = await db.prepare('SELECT name FROM tags').all<{ name: string }>();
  return sortTags(results.map((r) => r.name));
}

/** Every author once(case variants count as one), for suggestions. */
export async function listAuthors(db: D1Database): Promise<string[]> {
  const { results } = await db
    .prepare('SELECT author FROM recipes GROUP BY author COLLATE NOCASE ORDER BY author COLLATE NOCASE')
    .all<{ author: string }>();
  return results.map((r) => r.author);
}

/** Replaces the base information of a recipe; an omitted optional field is cleared, but an omitted seal is kept. When ingredients, steps or tags are given they replace the stored ones in the same batch (so atomically); when omitted the stored ones stay. Returns the image the recipe had before, or undefined when the recipe doesn't exist. */
export async function updateRecipe(
  db: D1Database,
  slug: string,
  recipe: Pick<RecipeInput, 'title' | 'author' | 'servings' | 'time' | 'intro' | 'image' | 'source' | 'seal' | 'ingredients' | 'steps' | 'tags'>,
): Promise<{ previousImage: string | null } | undefined> {
  const [before, result] = await db.batch([
    db.prepare('SELECT image FROM recipes WHERE slug = ?').bind(slug),
    db
      .prepare(
        // Another recipe's spelling of the author wins; the recipe's own doesn't, or "Oma" could never become "oma".
        `UPDATE recipes SET title = ?, author = COALESCE((SELECT author FROM recipes WHERE author = ? COLLATE NOCASE AND slug != ? LIMIT 1), ?),
        servings = ?, time = ?, intro = ?, image = ?, source = ?, seal = COALESCE(?, seal), updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
      WHERE slug = ?`,
      )
      .bind(
        recipe.title,
        recipe.author,
        slug,
        recipe.author,
        recipe.servings ?? null,
        recipe.time ?? null,
        recipe.intro ?? '',
        recipe.image ?? null,
        recipe.source?.trim() || null,
        recipe.seal ?? null,
        slug,
      ),
    ...(recipe.ingredients
      ? [
          db.prepare('DELETE FROM ingredients WHERE recipe_id = (SELECT id FROM recipes WHERE slug = ?)').bind(slug),
          ...recipe.ingredients.map((ing, i) =>
            db
              .prepare(
                'INSERT INTO ingredients (recipe_id, position, name, quantity_text, quantity_value, quantity_value_max, quantity_unit) SELECT id, ?, ?, ?, ?, ?, ? FROM recipes WHERE slug = ?',
              )
              .bind(i, ing.name, ing.quantityText ?? '', ing.quantityValue ?? null, ing.quantityValueMax ?? null, ing.quantityUnit ?? null, slug),
          ),
        ]
      : []),
    ...(recipe.steps
      ? [db.prepare('DELETE FROM steps WHERE recipe_id = (SELECT id FROM recipes WHERE slug = ?)').bind(slug), ...insertSteps(db, slug, recipe.steps)]
      : []),
    ...(recipe.tags
      ? [
          db.prepare('DELETE FROM recipe_tags WHERE recipe_id = (SELECT id FROM recipes WHERE slug = ?)').bind(slug),
          ...insertTags(db, slug, recipe.tags),
        ]
      : []),
  ]);
  return result.meta.changes > 0 ? { previousImage: (before.results[0] as { image: string | null }).image } : undefined;
}

/** Notes that the member opened the recipe, once per member and recipe. Nothing happens for an unknown recipe or a member without a user row. */
export async function recordView(db: D1Database, email: string, slug: string): Promise<void> {
  await db
    .prepare('INSERT OR IGNORE INTO recipe_views (user_id, recipe_id) SELECT u.id, r.id FROM users u, recipes r WHERE u.email = ? AND r.slug = ?')
    .bind(email, slug)
    .run();
}

/** Whether a recipe or a step uses the photo at this path. */
export async function isImageUsed(db: D1Database, image: string) {
  return !!(await db.prepare('SELECT 1 FROM recipes WHERE image = ?1 UNION ALL SELECT 1 FROM steps WHERE image = ?1 LIMIT 1').bind(image).first());
}

/** Deletes a recipe; its ingredients, steps, chips and views go with it (foreign keys cascade). Returns the image it had, or undefined when the recipe doesn't exist. */
export async function deleteRecipe(db: D1Database, slug: string): Promise<{ image: string | null } | undefined> {
  const row = await db.prepare('DELETE FROM recipes WHERE slug = ? RETURNING image').bind(slug).first<{ image: string | null }>();
  return row ?? undefined;
}

/** The member's own like and note for a recipe; `liked: false` and `note: ''` when there are none (or the member or recipe is unknown). */
export async function getMemberRecipeData(db: D1Database, email: string, slug: string): Promise<{ liked: boolean; note: string }> {
  const row = await db
    .prepare(
      `SELECT EXISTS (SELECT 1 FROM recipe_likes l WHERE l.user_id = u.id AND l.recipe_id = r.id) AS liked,
              (SELECT body FROM recipe_notes n WHERE n.user_id = u.id AND n.recipe_id = r.id) AS note
       FROM users u, recipes r WHERE u.email = ? AND r.slug = ?`,
    )
    .bind(email, slug)
    .first<{ liked: number; note: string | null }>();
  return { liked: !!row?.liked, note: row?.note ?? '' };
}

const known = async (db: D1Database, email: string, slug: string) =>
  (await db.prepare('SELECT 1 AS ok FROM users u, recipes r WHERE u.email = ? AND r.slug = ?').bind(email, slug).first()) !== null;

/** Stores or removes the member's like. Idempotent. Returns false for an unknown recipe or member. */
export async function setLike(db: D1Database, email: string, slug: string, liked: boolean): Promise<boolean> {
  const sql = liked
    ? 'INSERT OR IGNORE INTO recipe_likes (user_id, recipe_id) SELECT u.id, r.id FROM users u, recipes r WHERE u.email = ? AND r.slug = ?'
    : 'DELETE FROM recipe_likes WHERE user_id = (SELECT id FROM users WHERE email = ?) AND recipe_id = (SELECT id FROM recipes WHERE slug = ?)';
  await db.prepare(sql).bind(email, slug).run();
  return known(db, email, slug);
}

/** Stores the member's note, as typed. Text that is empty or only whitespace removes the note. Returns false for an unknown recipe or member. */
export async function setNote(db: D1Database, email: string, slug: string, body: string): Promise<boolean> {
  if (body.trim() === '') {
    await db
      .prepare(
        'DELETE FROM recipe_notes WHERE user_id = (SELECT id FROM users WHERE email = ?) AND recipe_id = (SELECT id FROM recipes WHERE slug = ?)',
      )
      .bind(email, slug)
      .run();
    return known(db, email, slug);
  }
  await db
    .prepare(
      `INSERT INTO recipe_notes (user_id, recipe_id, body) SELECT u.id, r.id, ? FROM users u, recipes r WHERE u.email = ? AND r.slug = ?
       ON CONFLICT (user_id, recipe_id) DO UPDATE SET body = excluded.body, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')`,
    )
    .bind(body, email, slug)
    .run();
  return known(db, email, slug);
}
