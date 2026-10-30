import type { RecipeSummary } from '~app/shared/recipe';
import { fold } from './fold';
import type { Lists } from './lists';

/** The words of a text: runs of letters and digits, folded. */
export const words = (text: string) =>
  fold(text)
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);

/** Whether all words of the entry appear in the name, next to each other and in the same order, as whole words. */
export function matches(entry: string, name: string): boolean {
  const wanted = words(entry);
  const have = words(name);
  if (wanted.length === 0) return false;
  return have.some((_, start) => wanted.every((w, i) => have[start + i] === w));
}

/** A recipe with what the lists make of it: the "Heb ik" entries it uses and does not use, and the ingredients nothing in the house covers. */
export type Ranked<T> = { recipe: T; used: string[]; unused: string[]; missing: string[] };

const collator = new Intl.Collator('nl', { sensitivity: 'base' });

/**
 * The recipes the lists leave, best match first. A "Liever niet" match drops a recipe; with "Heb ik" entries a recipe needs at least one match, and recipes with more matches come first.
 * `recipes` is newest first; recipes with as many matches keep the chosen order. `ingredients` has the ingredient names per slug, `staples` are never missing.
 */
export function rankRecipes<T extends Pick<RecipeSummary, 'slug' | 'title'>>(
  recipes: T[],
  ingredients: Record<string, string[]>,
  { heb, zonder, sort }: Lists,
  staples: string[],
): Ranked<T>[] {
  const ranked = recipes
    .map((recipe) => {
      const names = ingredients[recipe.slug] ?? [];
      const used = heb.filter((entry) => names.some((name) => matches(entry, name)));
      const missing: string[] = [];
      for (const name of names) {
        const covered = heb.some((e) => matches(e, name)) || staples.some((s) => matches(s, name));
        if (!covered && !missing.some((m) => fold(m) === fold(name))) missing.push(name);
      }
      const skipped = zonder.some((e) => names.some((n) => matches(e, n)));
      return { recipe, used, unused: heb.filter((entry) => !used.includes(entry)), missing, skipped };
    })
    .filter((r) => !r.skipped && (heb.length === 0 || r.used.length > 0));
  if (sort === 'az') ranked.sort((a, b) => collator.compare(a.recipe.title, b.recipe.title));
  // Array.prototype.sort is stable, so recipes with as many matches keep the chosen order.
  if (heb.length > 0) ranked.sort((a, b) => b.used.length - a.used.length);
  return ranked.map(({ recipe, used, unused, missing }) => ({ recipe, used, unused, missing }));
}
