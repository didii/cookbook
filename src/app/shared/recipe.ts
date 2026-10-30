// The shapes of a recipe's ingredients and steps, shared by the server and the browser. The recipes themselves are stored in D1.

/** The quantity text and name of an ingredient: the base of a recipe's ingredient row (RecipeIngredient), and a chip of a step on its own. A step's chip never refers to a row. */
export type Ingredient = { quantityText: string; name: string };

/** An ingredient row of a recipe: the quantity text as typed, plus its numeric value and unit when it has them (null for none), and for a range the second number as typed. */
export type RecipeIngredient = Ingredient & { quantityValue: number | null; quantityValueMax?: number | null; quantityUnit: string | null };

/** A chip of a step: the stored value and unit are there once derived on save (null for none); a chip the editor is still typing has neither. */
export type StepIngredient = Ingredient & { quantityValue?: number | null; quantityValueMax?: number | null; quantityUnit?: string | null };

/** An amount in a step's text that scales with the servings: where its number sits in the body (UTF-16 indexes, end exclusive), its value, and the unit that followed it (null for none). */
export type StepQuantity = {
  startIndex: number;
  endIndex: number;
  quantityValue: number;
  /** A range: the second number as typed, and where it sits in the body; all three or none. */
  quantityValueMax?: number | null;
  maxStartIndex?: number | null;
  maxEndIndex?: number | null;
  quantityUnit: string | null;
};

/** A step and what belongs to it: the ingredients it uses, an oven temperature and a timer, all optional. */
export type Step = {
  body: string;
  ingredients: StepIngredient[];
  /** The amounts in the body in text order; set on a stored step, absent while the editor is typing. */
  quantities?: StepQuantity[];
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
  /** Where the recipe came from: a name or a link. */
  source: string | null;
  seal: string | null;
  /** When the recipe was last saved; the editor compares it to the version a draft started from. */
  updated_at: string;
  ingredients: RecipeIngredient[];
  steps: Step[];
  /** Tag names, alphabetical (letter case and accents ignored). */
  tags: string[];
};

/** What a recipe card shows. */
export type RecipeSummary = {
  slug: string;
  title: string;
  author: string;
  time: string | null;
  image: string | null;
  seal: string | null;
  /** Tag names, the most used tag first (equal counts alphabetical). */
  tags: string[];
  /** The signed-in member has liked the recipe. */
  liked: boolean;
  /** The signed-in member has a note for the recipe. */
  hasNote: boolean;
  /** Added recently and not yet opened by the signed-in member. */
  isNew?: boolean;
};
