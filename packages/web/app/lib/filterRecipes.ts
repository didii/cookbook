import type { RecipeSummary } from '~/lib/recipe';

export type Sort = 'nieuwste' | 'az';

/** What the home page narrows and orders the recipes by. `author` is null for "Iedereen". */
export type Filters = { q: string; author: string | null; sort: Sort };

/** The author chips and the sort control appear from this many recipes up. */
export const minRecipesForFilters = 4;

/** Lowercase without accents, so "Crème" matches "creme". */
const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

const collator = new Intl.Collator('nl', { sensitivity: 'base' });

/** Filters from the page address (`q`, `auteur`, `sort`); anything missing or unknown is the default. */
export function parseFilters(params: URLSearchParams): Filters {
  return { q: params.get('q') ?? '', author: params.get('auteur') || null, sort: params.get('sort') === 'az' ? 'az' : 'nieuwste' };
}

/** The address parameters for the filters, leaving out defaults. */
export function filterParams({ q, author, sort }: Filters): URLSearchParams {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (author) params.set('auteur', author);
  if (sort !== 'nieuwste') params.set('sort', sort);
  return params;
}

/** Each author once (case variants are one, the first spelling wins), alphabetical. */
export function authorsOf(recipes: Pick<RecipeSummary, 'author'>[]): string[] {
  const seen = new Map<string, string>();
  for (const { author } of recipes) if (!seen.has(fold(author))) seen.set(fold(author), author);
  return [...seen.values()].sort(collator.compare);
}

/** The recipes whose title or author contain the search text and whose author matches, in the chosen order. `recipes` is newest first. */
export function filterRecipes<T extends Pick<RecipeSummary, 'title' | 'author'>>(recipes: T[], { q, author, sort }: Filters): T[] {
  const needle = fold(q).trim();
  const who = author && fold(author);
  const shown = recipes.filter(
    (r) => (!who || fold(r.author) === who) && (!needle || fold(r.title).includes(needle) || fold(r.author).includes(needle)),
  );
  return sort === 'az' ? shown.sort((a, b) => collator.compare(a.title, b.title)) : shown;
}

/** Whether anything narrows or reorders the list: the "N van M" line and the Wis filters button depend on it. */
export const isFiltered = ({ q, author, sort }: Filters) => q.trim() !== '' || author !== null || sort !== 'nieuwste';

/** The number on the Filter button: the author and the order, when not the default. The search text has its own box. */
export const activeFilterCount = ({ author, sort }: Filters) => Number(author !== null) + Number(sort !== 'nieuwste');
