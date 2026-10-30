export type Sort = 'nieuwste' | 'az';

/** What the home page narrows and orders the recipes by. Left out means no search, no authors, no tags, no favourites and newest first. */
export type Filters = { q?: string; authors?: string[]; tags?: string[]; sort?: Sort; liked?: boolean };

/** The address parameters for the filters, leaving out defaults. */
export function filterParams({ q, authors = [], tags = [], sort = 'nieuwste', liked = false }: Filters): URLSearchParams {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  for (const a of authors) params.append('auteur', a);
  for (const t of tags) params.append('tag', t);
  if (liked) params.set('favoriet', '1');
  if (sort !== 'nieuwste') params.set('sort', sort);
  return params;
}
