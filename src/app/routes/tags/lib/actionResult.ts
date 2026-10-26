/** What the tags action answers to a form: a short confirmation, or (with status 400) why nothing was changed. */
export type ActionResult =
  | { done: string }
  | { intent: string; error: string; code: 'empty' | 'tooLong' | 'taken' | 'notFound'; taken?: string };

export type ActionError = Extract<ActionResult, { error: string }>;

/** The error of an action answer, if it is one. */
export const errorOf = (result: ActionResult | undefined): ActionError | undefined => (result && 'error' in result ? result : undefined);
