import { findRecipe } from '~/lib/recipes';

/** The Appeltaart of the design preview: 13 steps with every kind of chip. It lives in the sample recipes. */
export const appeltaartSteps = findRecipe('appeltaart')!.steps;
