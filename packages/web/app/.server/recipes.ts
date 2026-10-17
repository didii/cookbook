export type RecipeRow = {
  id: number;
  slug: string;
  title: string;
  author: string;
  time: string | null;
  servings: number;
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
