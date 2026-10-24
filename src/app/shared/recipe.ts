// The shapes of a recipe's ingredients and steps, shared by the server and the browser. The recipes themselves are stored in D1.

/** The quantity text and name of an ingredient: the base of a recipe's ingredient row (RecipeIngredient), and a chip of a step on its own. A step's chip never refers to a row. */
export type Ingredient = { quantityText: string; name: string };

/** An ingredient row of a recipe: the quantity text as typed, plus its numeric value and unit when it has them (null for none, such as a range). */
export type RecipeIngredient = Ingredient & { quantityValue: number | null; quantityUnit: string | null };

/** A chip of a step: the stored value and unit are there once derived on save (null for none); a chip the editor is still typing has neither. */
export type StepIngredient = Ingredient & { quantityValue?: number | null; quantityUnit?: string | null };

/** A step and what belongs to it: the ingredients it uses, an oven temperature and a timer, all optional. */
export type Step = {
  body: string;
  ingredients: StepIngredient[];
  ovenTemperature?: number;
  timer?: { minutes: number; label?: string };
};

/** A stored recipe with its ingredients and steps in stored order. */
export type Recipe = {
  id: number;
  slug: string;
  title: string;
  author: string;
  time: string | null;
  servings: number | null;
  intro: string;
  image: string | null;
  seal: string | null;
  /** When the recipe was last saved; the editor compares it to the version a draft started from. */
  updated_at: string;
  ingredients: RecipeIngredient[];
  steps: Step[];
};

/** What a recipe card shows. */
export type RecipeSummary = {
  slug: string;
  title: string;
  author: string;
  time: string | null;
  image: string | null;
  seal: string | null;
  /** Category names in their stored order. */
  categories: string[];
  /** The signed-in member has liked the recipe. */
  liked: boolean;
  /** The signed-in member has a note for the recipe. */
  hasNote: boolean;
  /** Added recently and not yet opened by the signed-in member. */
  isNew?: boolean;
};
