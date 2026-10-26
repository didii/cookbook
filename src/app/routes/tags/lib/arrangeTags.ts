import { compareTags, type ManagedTag } from '~app/shared/tags';

export type TagOrder = 'name' | 'category';
export type TagFilters = { q: string; unused: boolean; withoutCategory: boolean; order: TagOrder };
/** `category` is null for tags without one; by name there is one group, which is rendered without a heading. */
export type TagGroup = { category: string | null; tags: ManagedTag[] };

/** The tags that pass the filters, grouped by the order: by name one group, by category one group per category (alphabetical) and a last one for tags without. */
export function arrangeTags(tags: ManagedTag[], { q, unused, withoutCategory, order }: TagFilters): TagGroup[] {
  const needle = q.trim().toLowerCase();
  const shown = tags
    .filter((t) => t.name.toLowerCase().includes(needle) && (!unused || t.uses === 0) && (!withoutCategory || t.category === null))
    .sort((a, b) => compareTags(a.name, b.name));
  if (!shown.length) return [];
  if (order === 'name') return [{ category: null, tags: shown }];
  const groups = new Map<string, ManagedTag[]>();
  for (const t of shown) groups.set(t.category ?? '', [...(groups.get(t.category ?? '') ?? []), t]);
  return [...groups]
    .sort(([a], [b]) => (a === '' ? 1 : b === '' ? -1 : compareTags(a, b)))
    .map(([category, list]) => ({ category: category || null, tags: list }));
}
