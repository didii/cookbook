import type { DraftSeed } from './draft';
import type { ImportedRecipe } from './import/readRecipe';
import { limits } from './recipeValidation';

/** Time the way the app writes it: "30 min" under an hour, otherwise "1u 20" (hours, then minutes with two digits). */
export function formatTime(minutes: number | undefined) {
  if (!minutes) return '';
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)}u ${String(minutes % 60).padStart(2, '0')}`;
}

/** The first whole number in a yield text such as "4 porties" or "Serves 6-8", as text; empty when there is none or it is out of range. */
export function servingsFrom(text: string) {
  const n = Number(/\d+/.exec(text)?.[0]);
  return n >= 1 && n <= limits.servings ? String(n) : '';
}

/**
 * Maps an imported recipe onto the editor's seed. Author, tags and the photo field come from `base` (the starting seed), the source is the address.
 * Steps are plain text: the editor proposes their chips. The image is returned beside the seed because it is fetched and handed to the photo field separately.
 */
export function toDraftSeed(imported: ImportedRecipe, address: string, base: DraftSeed): { seed: DraftSeed; imageUrl: string | undefined } {
  return {
    seed: {
      ...base,
      title: imported.title,
      intro: imported.intro,
      servings: servingsFrom(imported.servingsText),
      time: formatTime(imported.minutes),
      source: address,
      ingredients: imported.ingredients,
      steps: imported.steps.map((body) => ({ body, ingredients: [] })),
    },
    imageUrl: imported.image,
  };
}
