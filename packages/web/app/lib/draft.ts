import type { Values } from '~/shared/recipeValidation';

/** The editor's content. Later changes add keys (ingredients, steps). */
export type Draft = Values;

export const emptyDraft: Draft = { title: '', author: '', servings: '', time: '', intro: '', image: '' };

/** The starting draft: the stored values when there are any, otherwise empty. */
export const startingDraft = (stored?: Draft): Draft => ({ ...(stored ?? emptyDraft) });

const normalize = (draft: Draft) => JSON.stringify(draft, (_, v) => (typeof v === 'string' ? v.trim() : v));

/** Whether the draft differs from where it started; surrounding whitespace is not a difference. */
export const isDirty = (initial: Draft, current: Draft) => normalize(initial) !== normalize(current);
