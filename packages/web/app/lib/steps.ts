import type { Step } from '~/lib/recipes';

/** "30 min", "1 u", "1 u 30". */
export const formatMinutes = (minutes: number) => {
  if (minutes < 60) return `${minutes} min`;
  const rest = minutes % 60;
  return `${Math.floor(minutes / 60)} u${rest ? ` ${rest}` : ''}`;
};

/** Until chips are stored, a step is just its text. */
export const toSteps = (bodies: string[]): Step[] => bodies.map((body) => ({ body, ingredients: [] }));
