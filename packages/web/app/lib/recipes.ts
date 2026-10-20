// The shapes of a recipe's ingredients and steps, shared by the server and the browser. The recipes themselves are stored in D1.

/** An ingredient row of a recipe, or a chip of a step: free text, a step's chip never refers to a row. Same shape as the stored ingredient. */
export type Ingredient = { quantity_text: string; name: string };

/** A step and what belongs to it: the ingredients it uses, an oven temperature and a timer, all optional. */
export type Step = {
  body: string;
  ingredients: Ingredient[];
  ovenTemperature?: number;
  timer?: { minutes: number; label?: string };
};
