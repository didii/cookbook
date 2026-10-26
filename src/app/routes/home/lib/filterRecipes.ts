import type { RecipeSummary } from '~app/shared/recipe';
import { sortTags } from '~app/shared/tags';

export type Sort = 'nieuwste' | 'az';

/** What the home page narrows and orders the recipes by. Left out means no search, no authors, no tags and newest first. */
export type Filters = { q?: string; authors?: string[]; tags?: string[]; sort?: Sort };

/** No search, everyone, newest first. */
export const noFilters: Filters = { q: '', sort: 'nieuwste' };

/** The author field and the sort control appear from this many recipes up. */
export const minRecipesForFilters = 4;

/** Lowercase without accents, so "Crème" matches "creme". */
const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

const collator = new Intl.Collator('nl', { sensitivity: 'base' });

/** Whether two spellings are the same author or tag (case and accents ignored). */
export const sameName = (a: string, b: string) => collator.compare(a, b) === 0;

/** Filters from the page address (`q`, `auteur`, `tag`, `sort`); anything missing or unknown is the default. */
export function parseFilters(params: URLSearchParams): Filters {
  return {
    q: params.get('q') ?? '',
    authors: params.getAll('auteur').filter(Boolean),
    tags: params.getAll('tag').filter(Boolean),
    sort: params.get('sort') === 'az' ? 'az' : 'nieuwste',
  };
}

/** The address parameters for the filters, leaving out defaults. */
export function filterParams({ q, authors = [], tags = [], sort = 'nieuwste' }: Filters): URLSearchParams {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  for (const a of authors) params.append('auteur', a);
  for (const t of tags) params.append('tag', t);
  if (sort !== 'nieuwste') params.set('sort', sort);
  return params;
}

/** Each author once (case variants are one, the first spelling wins), alphabetical. */
export function authorsOf(recipes: Pick<RecipeSummary, 'author'>[]): string[] {
  const authors: string[] = [];
  for (const { author } of recipes) if (!authors.some((a) => sameName(a, author))) authors.push(author);
  return authors.sort(collator.compare);
}

/** Each tag once (case variants are one, the first spelling wins), alphabetical. */
export function tagsOf(recipes: Pick<RecipeSummary, 'tags'>[]): string[] {
  const tags: string[] = [];
  for (const { tags: own } of recipes) for (const t of own) if (!tags.some((x) => sameName(x, t))) tags.push(t);
  return sortTags(tags);
}

/** The recipes whose title, author or a tag contain the search text, whose author is any picked author and that have any picked tag. Recipes with more picked tags come first; within a group the chosen order holds. `recipes` is newest first. */
export function filterRecipes<T extends Pick<RecipeSummary, 'title' | 'author' | 'tags'>>(
  recipes: T[],
  { q = '', authors = [], tags = [], sort }: Filters,
): T[] {
  const needle = fold(q).trim();
  // A tag picked twice (in another letter case) counts once.
  const picked = tags.filter((t, i) => tags.findIndex((x) => sameName(x, t)) === i);
  const matches = (r: T) => picked.filter((t) => r.tags.some((x) => sameName(x, t))).length;
  const found = recipes
    .filter(
      (r) =>
        (authors.length === 0 || authors.some((a) => sameName(r.author, a))) &&
        (!needle || fold(r.title).includes(needle) || fold(r.author).includes(needle) || r.tags.some((t) => fold(t).includes(needle))),
    )
    .map((recipe) => ({ recipe, matches: matches(recipe) }))
    .filter((r) => tags.length === 0 || r.matches > 0);
  if (sort === 'az') found.sort((a, b) => collator.compare(a.recipe.title, b.recipe.title));
  // Array.prototype.sort is stable, so recipes with as many matches keep the chosen order.
  if (tags.length > 0) found.sort((a, b) => b.matches - a.matches);
  return found.map((r) => r.recipe);
}

/** Whether anything narrows or reorders the list: the "N van M" line and the Wis filters button depend on it. */
export const isFiltered = ({ q = '', authors = [], tags = [], sort }: Filters) =>
  q.trim() !== '' || authors.length > 0 || tags.length > 0 || sort === 'az';

/** The number on the Filter button: the authors and the tags (each one, however many) and the order, when not the default. The search text has its own box. */
export const activeFilterCount = ({ authors = [], tags = [], sort }: Filters) =>
  Number(authors.length > 0) + Number(tags.length > 0) + Number(sort === 'az');
