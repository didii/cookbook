/** What a step can carry beside its text. Three lists because they will become three tables; chips are free text and never refer to ingredient rows. */
export type StepChips = {
  ingredients: { quantity: string; name: string }[];
  oven: { degrees: number }[];
  timers: { minutes: number; label?: string }[];
};

export type Step = { body: string; chips: StepChips };

/** "30 min", "1 u", "1 u 30". */
export const formatMinutes = (minutes: number) => {
  if (minutes < 60) return `${minutes} min`;
  const rest = minutes % 60;
  return `${Math.floor(minutes / 60)} u${rest ? ` ${rest}` : ''}`;
};

/** Until chips are stored, a step is just its text. */
export const toSteps = (bodies: string[]): Step[] => bodies.map((body) => ({ body, chips: { ingredients: [], oven: [], timers: [] } }));
