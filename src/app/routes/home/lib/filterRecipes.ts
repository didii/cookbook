import type { RecipeSummary } from '~app/shared/recipe';

export type Sort = 'nieuwste' | 'az';

/** What the home page narrows and orders the recipes by. Left out means no search, no authors and newest first. */
export type Filters = { q?: string; authors?: string[]; sort?: Sort };

/** No search, everyone, newest first. */
export const noFilters: Filters = { q: '', sort: 'nieuwste' };

/** The author field and the sort control appear from this many recipes up. */
export const minRecipesForFilters = 4;

/** Lowercase without accents, so "Crème" matches "creme". */
const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

const collator = new Intl.Collator('nl', { sensitivity: 'base' });

/** Whether two spellings are the same author (case and accents ignored). */
export const sameAuthor = (a: string, b: string) => collator.compare(a, b) === 0;

/** Filters from the page address (`q`, `auteur`, `sort`); anything missing or unknown is the default. */
export function parseFilters(params: URLSearchParams): Filters {
  return { q: params.get('q') ?? '', authors: params.getAll('auteur').filter(Boolean), sort: params.get('sort') === 'az' ? 'az' : 'nieuwste' };
}

/** The address parameters for the filters, leaving out defaults. */
export function filterParams({ q, authors = [], sort = 'nieuwste' }: Filters): URLSearchParams {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  for (const a of authors) params.append('auteur', a);
  if (sort !== 'nieuwste') params.set('sort', sort);
  return params;
}

/** Each author once (case variants are one, the first spelling wins), alphabetical. */
export function authorsOf(recipes: Pick<RecipeSummary, 'author'>[]): string[] {
  const authors: string[] = [];
  for (const { author } of recipes) if (!authors.some((a) => sameAuthor(a, author))) authors.push(author);
  return authors.sort(collator.compare);
}

/** The recipes whose title or author contain the search text and whose author matches, in the chosen order. `recipes` is newest first. */
export function filterRecipes<T extends Pick<RecipeSummary, 'title' | 'author'>>(recipes: T[], { q = '', authors = [], sort }: Filters): T[] {
  const needle = fold(q).trim();
  const shown = recipes.filter(
    (r) =>
      (authors.length === 0 || authors.some((a) => sameAuthor(r.author, a))) &&
      (!needle || fold(r.title).includes(needle) || fold(r.author).includes(needle)),
  );
  return sort === 'az' ? shown.sort((a, b) => collator.compare(a.title, b.title)) : shown;
}

/** Whether anything narrows or reorders the list: the "N van M" line and the Wis filters button depend on it. */
export const isFiltered = ({ q = '', authors = [], sort }: Filters) => q.trim() !== '' || authors.length > 0 || sort === 'az';

/** The number on the Filter button: the authors (one, however many) and the order, when not the default. The search text has its own box. */
export const activeFilterCount = ({ authors = [], sort }: Filters) => Number(authors.length > 0) + Number(sort === 'az');
