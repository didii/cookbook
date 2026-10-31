import type { Recipe } from '~app/shared/recipe';

/** What the public page may know of a recipe. Every field is listed one by one, so a field added to `Recipe`, a step or an ingredient is not public by accident. */
export function publicRecipe(r: Recipe) {
  const recipe = {
    slug: r.slug,
    title: r.title,
    author: r.author,
    time: r.time,
    servings: r.servings,
    intro: r.intro,
    source: r.source,
    image: r.image,
    seal: r.seal,
    tags: r.tags,
    ingredients: r.ingredients.map(({ quantityText, quantityValue, quantityValueMax, quantityUnit, name }) => ({
      quantityText,
      quantityValue,
      quantityValueMax,
      quantityUnit,
      name,
    })),
  };
  const steps = r.steps.map(({ body, ingredients, quantities, ovenTemperature, timer }) => ({
    body,
    ingredients: ingredients.map(({ quantityText, quantityValue, quantityValueMax, quantityUnit, name }) => ({
      quantityText,
      quantityValue,
      quantityValueMax,
      quantityUnit,
      name,
    })),
    quantities: quantities?.map(({ startIndex, endIndex, quantityValue, quantityValueMax, maxStartIndex, maxEndIndex, quantityUnit }) => ({
      startIndex,
      endIndex,
      quantityValue,
      quantityValueMax,
      maxStartIndex,
      maxEndIndex,
      quantityUnit,
    })),
    ovenTemperature,
    timer: timer && { minutes: timer.minutes, label: timer.label },
  }));
  return { recipe, steps };
}
