import type { Sort } from '~app/shared/filterParams';
import { cleanEntry, sameEntry } from './fold';
import type { ListKind } from './IngredientList';

/** What the fridge page narrows and orders the recipes by: the "Heb ik" and "Liever niet" entries and the order. */
export type Lists = { heb: string[]; zonder: string[]; sort: Sort };

export const noLists: Lists = { heb: [], zonder: [], sort: 'nieuwste' };

const withoutRepeats = (entries: string[]) => entries.map(cleanEntry).filter((e, i, all) => e && all.findIndex((x) => sameEntry(x, e)) === i);

/** The lists from the page address (`heb`, `zonder`, `sort`); anything missing or unknown is empty or the default. A word in both lists stays only in "Liever niet". */
export function parseLists(params: URLSearchParams): Lists {
  const zonder = withoutRepeats(params.getAll('zonder'));
  return {
    heb: withoutRepeats(params.getAll('heb')).filter((e) => !zonder.some((z) => sameEntry(z, e))),
    zonder,
    sort: params.get('sort') === 'az' ? 'az' : 'nieuwste',
  };
}

/** The address parameters for the lists, leaving out the default order. */
export function listParams({ heb, zonder, sort }: Lists): URLSearchParams {
  const params = new URLSearchParams();
  for (const e of heb) params.append('heb', e);
  for (const e of zonder) params.append('zonder', e);
  if (sort === 'az') params.set('sort', 'az');
  return params;
}

/** Whether an entry or the order narrows or reorders the recipes. */
export const isFiltered = ({ heb, zonder, sort }: Lists) => heb.length > 0 || zonder.length > 0 || sort === 'az';

/** Adds the text to a list: trimmed, empty text and a word already there ignored, and taken out of the other list. */
export function addEntry(lists: Lists, kind: ListKind, text: string): Lists {
  const entry = cleanEntry(text);
  if (!entry) return lists;
  const other = kind === 'heb' ? 'zonder' : 'heb';
  const own = lists[kind].some((e) => sameEntry(e, entry)) ? lists[kind] : [...lists[kind], entry];
  return { ...lists, [kind]: own, [other]: lists[other].filter((e) => !sameEntry(e, entry)) };
}

/** Takes the entry out of a list. */
export const removeEntry = (lists: Lists, kind: ListKind, entry: string): Lists => ({ ...lists, [kind]: lists[kind].filter((e) => e !== entry) });
