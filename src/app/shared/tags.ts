const collator = new Intl.Collator('nl', { sensitivity: 'base' });

/** Alphabetical order of tag names, letter case and accents ignored. */
export const compareTags = (a: string, b: string) => collator.compare(a, b);

/** The tags sorted alphabetically (letter case and accents ignored), as a new list. */
export const sortTags = (tags: readonly string[]) => [...tags].sort(compareTags);

/** Tag name to category, for the tags that have one. */
export const categoriesOf = (tags: readonly ManagedTag[]): Record<string, string> =>
  Object.fromEntries(tags.flatMap((t) => (t.category ? [[t.name, t.category]] : [])));

/** A tag in the tag manager: its category (if any) and the number of recipes that have it. */
export type ManagedTag = { name: string; category: string | null; uses: number };
