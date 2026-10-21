import type { Recipe, RecipeSummary, Step } from '~/lib/recipe';
import { pickSeal } from '~/lib/seals';

export type RecipeRow = {
  id: number;
  slug: string;
  title: string;
  author: string;
  time: string | null;
  servings: number | null;
  intro: string;
  image: string | null;
  seal: string | null;
  /** When the recipe was last saved; the editor compares it to the version a draft started from. */
  updated_at: string;
};

export type IngredientRow = { quantityText: string; name: string };

/** A step to store: its text, and any ingredient chips, oven temperature and timer. */
export type StepInput = Pick<Step, 'body'> & Partial<Step>;

type StepRow = { id: number; body: string; oven_temperature: number | null; timer_minutes: number | null; timer_label: string | null };

/** One round trip (a single batch): the recipe plus its ingredients and steps (with their chips) in stored order. */
export async function getRecipe(db: D1Database, slug: string): Promise<Recipe | undefined> {
  const [recipe, ingredients, steps, chips] = await db.batch([
    db.prepare('SELECT id, slug, title, author, time, servings, intro, image, seal, updated_at FROM recipes WHERE slug = ?').bind(slug),
    db
      .prepare(
        'SELECT i.quantity_text AS quantityText, i.name FROM ingredients i JOIN recipes r ON r.id = i.recipe_id WHERE r.slug = ? ORDER BY i.position',
      )
      .bind(slug),
    db
      .prepare(
        'SELECT s.id, s.body, s.oven_temperature, s.timer_minutes, s.timer_label FROM steps s JOIN recipes r ON r.id = s.recipe_id WHERE r.slug = ? ORDER BY s.position',
      )
      .bind(slug),
    db
      .prepare(
        'SELECT c.step_id, c.quantity_text AS quantityText, c.name FROM step_ingredient_chips c JOIN steps s ON s.id = c.step_id JOIN recipes r ON r.id = s.recipe_id WHERE r.slug = ? ORDER BY s.position, c.position',
      )
      .bind(slug),
  ]);
  const row = (recipe.results as RecipeRow[])[0];
  if (!row) return undefined;
  const chipRows = chips.results as (IngredientRow & { step_id: number })[];
  return {
    ...row,
    ingredients: ingredients.results as IngredientRow[],
    steps: (steps.results as StepRow[]).map((s) => ({
      body: s.body,
      ingredients: chipRows.filter((c) => c.step_id === s.id).map((c) => ({ quantityText: c.quantityText, name: c.name })),
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
  seal?: string;
  createdBy?: string;
  ingredients?: { name: string; quantityText?: string; amount?: number; unit?: string }[];
  steps?: StepInput[];
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

/** Statements that store the steps (and their chips) of the recipe with this slug, at the places 0, 1, …; none if there is no such recipe. */
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
          'INSERT INTO step_ingredient_chips (step_id, position, quantity_text, name) SELECT s.id, ?, ?, ? FROM steps s JOIN recipes r ON r.id = s.recipe_id WHERE r.slug = ? AND s.position = ?',
        )
        .bind(j, chip.quantityText, chip.name, slug, i),
    ),
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
        'INSERT INTO recipes (slug, title, author, servings, time, intro, image, seal, created_by) VALUES (?, ?, COALESCE((SELECT author FROM recipes WHERE author = ? COLLATE NOCASE LIMIT 1), ?), ?, ?, ?, ?, ?, ?)',
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
        seal,
        recipe.createdBy ?? null,
      ),
    ...(recipe.ingredients ?? []).map((ing, i) =>
      db
        .prepare(`INSERT INTO ingredients (recipe_id, position, name, quantity_text, amount, unit) VALUES (${idOf}, ?, ?, ?, ?, ?)`)
        .bind(slug, i, ing.name, ing.quantityText ?? '', ing.amount ?? null, ing.unit ?? null),
    ),
    ...insertSteps(db, slug, recipe.steps ?? []),
  ]);
  return slug;
}

/** A recipe is "new" to a member for this many months after it was added. */
export const newForMonths = 1;

/** Every recipe, the most recently added first, each flagged `isNew` for this member: added less than `newForMonths` before `now`, not opened by them and not added by them. */
export async function listRecipes(db: D1Database, email: string, now: Date): Promise<RecipeSummary[]> {
  const cutoff = new Date(now);
  cutoff.setUTCMonth(cutoff.getUTCMonth() - newForMonths);
  const { results } = await db
    .prepare(
      `SELECT r.slug, r.title, r.author, r.time, r.image, r.seal,
        (r.created_at > ?1 AND v.recipe_id IS NULL AND COALESCE(r.created_by <> ?2 COLLATE NOCASE, 1)) AS isNew
      FROM recipes r
      LEFT JOIN recipe_views v ON v.recipe_id = r.id AND v.user_id = (SELECT id FROM users WHERE email = ?2)
      ORDER BY r.id DESC`,
    )
    .bind(cutoff.toISOString().replace(/\.\d+Z$/, 'Z'), email)
    .all<Omit<RecipeSummary, 'isNew'> & { isNew: 0 | 1 }>();
  return results.map((r) => ({ ...r, isNew: r.isNew === 1 }));
}

/** Every author once(case variants count as one), for suggestions. */
export async function listAuthors(db: D1Database): Promise<string[]> {
  const { results } = await db
    .prepare('SELECT author FROM recipes GROUP BY author COLLATE NOCASE ORDER BY author COLLATE NOCASE')
    .all<{ author: string }>();
  return results.map((r) => r.author);
}

/** Replaces the base information of a recipe; an omitted optional field is cleared, but an omitted seal is kept. When ingredients or steps are given they replace the stored ones in the same batch (so atomically); when omitted the stored ones stay. Returns the image the recipe had before, or undefined when the recipe doesn't exist. */
export async function updateRecipe(
  db: D1Database,
  slug: string,
  recipe: Pick<RecipeInput, 'title' | 'author' | 'servings' | 'time' | 'intro' | 'image' | 'seal' | 'ingredients' | 'steps'>,
): Promise<{ previousImage: string | null } | undefined> {
  const [before, result] = await db.batch([
    db.prepare('SELECT image FROM recipes WHERE slug = ?').bind(slug),
    db
      .prepare(
        // Another recipe's spelling of the author wins; the recipe's own doesn't, or "Oma" could never become "oma".
        `UPDATE recipes SET title = ?, author = COALESCE((SELECT author FROM recipes WHERE author = ? COLLATE NOCASE AND slug != ? LIMIT 1), ?),
        servings = ?, time = ?, intro = ?, image = ?, seal = COALESCE(?, seal), updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
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
        recipe.seal ?? null,
        slug,
      ),
    ...(recipe.ingredients
      ? [
          db.prepare('DELETE FROM ingredients WHERE recipe_id = (SELECT id FROM recipes WHERE slug = ?)').bind(slug),
          ...recipe.ingredients.map((ing, i) =>
            db
              .prepare(
                'INSERT INTO ingredients (recipe_id, position, name, quantity_text, amount, unit) SELECT id, ?, ?, ?, ?, ? FROM recipes WHERE slug = ?',
              )
              .bind(i, ing.name, ing.quantityText ?? '', ing.amount ?? null, ing.unit ?? null, slug),
          ),
        ]
      : []),
    ...(recipe.steps
      ? [db.prepare('DELETE FROM steps WHERE recipe_id = (SELECT id FROM recipes WHERE slug = ?)').bind(slug), ...insertSteps(db, slug, recipe.steps)]
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
