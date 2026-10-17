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
};

export type IngredientRow = { quantity_text: string; name: string };

export type StoredRecipe = RecipeRow & { ingredients: IngredientRow[]; steps: string[] };

/** One round trip (a single batch): the recipe plus its ingredients and steps in stored order. */
export async function getRecipe(db: D1Database, slug: string): Promise<StoredRecipe | undefined> {
  const [recipe, ingredients, steps] = await db.batch([
    db.prepare('SELECT id, slug, title, author, time, servings, intro, image, seal FROM recipes WHERE slug = ?').bind(slug),
    db
      .prepare('SELECT i.quantity_text, i.name FROM ingredients i JOIN recipes r ON r.id = i.recipe_id WHERE r.slug = ? ORDER BY i.position')
      .bind(slug),
    db.prepare('SELECT s.body FROM steps s JOIN recipes r ON r.id = s.recipe_id WHERE r.slug = ? ORDER BY s.position').bind(slug),
  ]);
  const row = (recipe.results as RecipeRow[])[0];
  if (!row) return undefined;
  return {
    ...row,
    ingredients: ingredients.results as IngredientRow[],
    steps: (steps.results as { body: string }[]).map((s) => s.body),
  };
}

export type NewRecipe = {
  title: string;
  author: string;
  servings?: number;
  time?: string;
  intro?: string;
  image?: string;
  seal?: string;
  createdBy?: string;
  ingredients?: { name: string; quantityText?: string; amount?: number; unit?: string }[];
  steps?: string[];
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

/** Stores a recipe with its ingredients and steps in one batch and returns its slug. */
export async function createRecipe(db: D1Database, recipe: NewRecipe): Promise<string> {
  const slug = await freeSlug(db, recipe.title);
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
        recipe.seal ?? null,
        recipe.createdBy ?? null,
      ),
    ...(recipe.ingredients ?? []).map((ing, i) =>
      db
        .prepare(`INSERT INTO ingredients (recipe_id, position, name, quantity_text, amount, unit) VALUES (${idOf}, ?, ?, ?, ?, ?)`)
        .bind(slug, i + 1, ing.name, ing.quantityText ?? '', ing.amount ?? null, ing.unit ?? null),
    ),
    ...(recipe.steps ?? []).map((body, i) =>
      db.prepare(`INSERT INTO steps (recipe_id, position, body) VALUES (${idOf}, ?, ?)`).bind(slug, i + 1, body),
    ),
  ]);
  return slug;
}

/** Every author once (case variants count as one), for suggestions. */
export async function listAuthors(db: D1Database): Promise<string[]> {
  const { results } = await db
    .prepare('SELECT author FROM recipes GROUP BY author COLLATE NOCASE ORDER BY author COLLATE NOCASE')
    .all<{ author: string }>();
  return results.map((r) => r.author);
}
