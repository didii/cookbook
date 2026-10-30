/** How many photos the page lists at most. */
export const photoCap = 100;

export type PhotoRecipe = { title: string; slug: string };
/** A stored photo. `recipe` is the recipe that uses it (the first one when several share it), null when none does. */
export type StoredPhotoInfo = { name: string; size: number; uploaded: Date; recent: boolean; recipe: PhotoRecipe | null };
/** "Ongebruikt" hides the photos a recipe or step uses, "Ouder dan 1 dag" hides those uploaded less than 24 hours ago. */
export type PhotoFilters = { onlyUnused: boolean; onlyOld: boolean };

/** The address parameter of each filter; `=0` turns it off, anything else (or nothing) leaves it on. */
export const filterParam = { onlyUnused: 'ongebruikt', onlyOld: 'ouder' } as const;

/** The filters in the address; both are on when absent. */
export const readFilters = (params: URLSearchParams): PhotoFilters => ({
  onlyUnused: params.get(filterParam.onlyUnused) !== '0',
  onlyOld: params.get(filterParam.onlyOld) !== '0',
});

/** The address parameters with one filter turned on or off. */
export function withFilter(params: URLSearchParams, filter: keyof PhotoFilters, on: boolean) {
  const next = new URLSearchParams(params);
  if (on) next.delete(filterParam[filter]);
  else next.set(filterParam[filter], '0');
  return next;
}

/** What a delete answers: how many photos went, and the recipe of every photo that was kept because it is used. */
export type DeleteResult = { deleted: number; kept: PhotoRecipe[] };
