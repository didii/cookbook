/** What a step can carry beside its text. Three lists because they will become three tables; chips are free text and never refer to ingredient rows. */
export type StepChips = {
  ingredients: { quantity: string; name: string }[];
  oven: { degrees: number }[];
  timers: { minutes: number; label?: string }[];
};

export type Step = { body: string; chips: StepChips };

/** Until chips are stored, a step is just its text. */
export const toSteps = (bodies: string[]): Step[] => bodies.map((body) => ({ body, chips: { ingredients: [], oven: [], timers: [] } }));
