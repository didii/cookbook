import type { Rules } from '~app/shared/rules';
import { isDirty, withFreeRow, type RecipeDraft } from './draft';
import type { Chip, Ghost, StepDraft } from './steps/chips';

/** The part of `Storage` the drafts need; `localStorage` fits, and so does a fake in a test. */
export type DraftStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'key' | 'length'>;

/** The browser's local storage, or nothing when it is blocked (private mode, site data disabled). */
export function browserStorage(): DraftStorage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

/** The form field that tells a save which draft to end. */
export const draftKeyField = 'draftKey';

/** Bump when the shape of the editor's `RecipeDraft` changes: older drafts are then ignored. */
const version = 1;
const prefix = 'cookbook:draft:';
const maxAgeMs = 30 * 24 * 60 * 60 * 1000;
const maxDrafts = 20;

/** What is kept: the editor's state and what it started from. `base.updatedAt` is the stored recipe's `updated_at` when the draft was started (none for a new recipe). */
export type StoredDraft = { v: typeof version; savedAt: string; base: { updatedAt?: string }; state: RecipeDraft };

/** The key of one family member's draft of a recipe, or of a new recipe when there is no slug. The prefix on the slug keeps a recipe called "new" apart from a new recipe. */
export const draftKey = (email: string, slug?: string) => `${prefix}${email.trim().toLowerCase()}:${slug === undefined ? 'new' : `r:${slug}`}`;

/** Runs `action`; a storage that throws (disabled, full) is a failed call, never an error. */
function attempt(action: () => void): boolean {
  try {
    action();
    return true;
  } catch {
    return false;
  }
}

export type Keeping = {
  /** The editor's state now. */
  state: RecipeDraft;
  /** The state the editor started from; a draft equal to it is not kept. */
  initial: RecipeDraft;
  base: { updatedAt?: string };
  /** Whether a photo is still going up. Then the draft holds `settledImage` instead of the photo field's value. */
  uploading: boolean;
  /** The last photo path that was settled (the one a photo that is going up replaces). */
  settledImage: string;
  now: Date;
  rules: Rules;
};

/** Keeps the state under the key, or removes the draft when the state equals where the editor started. `ok` is false when the storage refused the write; removing never counts as a failure. */
export function saveDraft(
  storage: DraftStorage | undefined,
  key: string,
  { state, initial, base, uploading, settledImage, now, rules }: Keeping,
): { ok: boolean } {
  if (!isDirty(initial, state, rules)) {
    clearDraft(storage, key);
    return { ok: true };
  }
  if (!storage) return { ok: false };
  const stored: StoredDraft = { v: version, savedAt: now.toISOString(), base, state: uploading ? { ...state, image: settledImage } : state };
  return { ok: attempt(() => storage.setItem(key, JSON.stringify(stored))) };
}

/** Removes the draft; true when the storage let it. */
export const clearDraft = (storage: DraftStorage | undefined, key: string) => !storage || attempt(() => storage.removeItem(key));

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isString = (v: unknown): v is string => typeof v === 'string';
const isRange = (v: unknown) => isObject(v) && Number.isInteger(v.start) && Number.isInteger(v.end);
const optional = (v: unknown, ok: (v: unknown) => boolean) => v === undefined || ok(v);

const isChip = (c: unknown) =>
  isObject(c) &&
  isString(c.id) &&
  (c.kind === 'ingredient' || c.kind === 'oven' || c.kind === 'timer') &&
  (c.mode === 'auto' || c.mode === 'manual') &&
  isObject(c.values) &&
  optional(c.anchor, isRange) &&
  optional(c.rowId, isString) &&
  optional(c.label, isString) &&
  optional(c.lost, (v) => v === true) &&
  optional(c.ignored, isObject);
const isGhost = (g: unknown) =>
  isObject(g) && isString(g.id) && ['ingredient', 'oven', 'timer'].includes(g.kind as string) && isRange(g.anchor) && optional(g.rowId, isString);
const isStep = (s: unknown) =>
  isObject(s) &&
  isString(s.id) &&
  isString(s.body) &&
  Array.isArray(s.chips) &&
  s.chips.every(isChip) &&
  Array.isArray(s.ghosts) &&
  s.ghosts.every(isGhost);
const isRow = (r: unknown) => isObject(r) && isString(r.id) && isString(r.text);

/** Whether the parsed JSON has exactly the shape of a draft of this version. */
function isStoredDraft(d: unknown): d is StoredDraft {
  if (!isObject(d) || d.v !== version || !isString(d.savedAt) || Number.isNaN(Date.parse(d.savedAt))) return false;
  if (!isObject(d.base) || !optional(d.base.updatedAt, isString)) return false;
  const s = d.state;
  return (
    isObject(s) &&
    ['title', 'author', 'servings', 'time', 'intro', 'image'].every((f) => isString(s[f])) &&
    Array.isArray(s.ingredients) &&
    s.ingredients.every(isRow) &&
    Array.isArray(s.steps) &&
    s.steps.length > 0 &&
    s.steps.every(isStep) &&
    optional(s.source, isString) &&
    optional(s.tags, (t) => Array.isArray(t) && t.every(isString))
  );
}

function parse(text: string | null): StoredDraft | undefined {
  try {
    const parsed: unknown = JSON.parse(text ?? '');
    // A draft kept before tags or the source existed has none.
    return isStoredDraft(parsed)
      ? { ...parsed, state: { ...parsed.state, tags: parsed.state.tags ?? [], source: parsed.state.source ?? '' } }
      : undefined;
  } catch {
    return undefined;
  }
}

/** The draft under the key. One that cannot be read, or that an older version of the editor made, is removed and counts as none. */
export function loadDraft(storage: DraftStorage | undefined, key: string): StoredDraft | undefined {
  if (!storage) return undefined;
  let text: string | null;
  try {
    text = storage.getItem(key);
  } catch {
    return undefined;
  }
  if (text === null) return undefined;
  const draft = parse(text);
  if (!draft) clearDraft(storage, key);
  return draft;
}

/** Removes the drafts kept more than 30 days ago, those that cannot be read, and all but the 20 most recent. */
export function purgeDrafts(storage: DraftStorage | undefined, now: Date) {
  if (!storage) return;
  try {
    const keys = Array.from({ length: storage.length }, (_, i) => storage.key(i)).filter((k): k is string => !!k?.startsWith(prefix));
    const kept: { key: string; savedAt: number }[] = [];
    for (const key of keys) {
      const draft = parse(storage.getItem(key));
      if (draft && now.getTime() - Date.parse(draft.savedAt) <= maxAgeMs) kept.push({ key, savedAt: Date.parse(draft.savedAt) });
      else storage.removeItem(key);
    }
    kept.sort((a, b) => b.savedAt - a.savedAt);
    for (const { key } of kept.slice(maxDrafts)) storage.removeItem(key);
  } catch {
    // Storage that fails halfway leaves the rest for the next time.
  }
}

/** Whether the navigation that opened the editor was the "Bewerk" item of the recipe actions menu, which marks itself in the history state. */
export const isFresh = (locationState: unknown) => isObject(locationState) && locationState.fresh === true;

const fits = (body: string, anchor?: { start: number; end: number }) =>
  !anchor || (anchor.start >= 0 && anchor.start < anchor.end && anchor.end <= body.length);

/** A step of a restored draft with only the chips and ghosts that still fit its text and the ingredient rows. A chip whose words or row are gone becomes an unanchored pinned chip; a ghost like that goes. */
function fitStep(step: StepDraft, rowIds: Set<string>): StepDraft {
  const chips = step.chips.map((chip): Chip => {
    const anchored = fits(step.body, chip.anchor);
    const linked = !chip.rowId || rowIds.has(chip.rowId);
    if (anchored && linked) return chip;
    return {
      ...chip,
      mode: 'manual',
      anchor: anchored ? chip.anchor : undefined,
      lost: anchored ? chip.lost : undefined,
      rowId: linked ? chip.rowId : undefined,
      ignored: undefined,
    } as Chip;
  });
  const ghosts = step.ghosts.filter((g: Ghost) => fits(step.body, g.anchor) && (!g.rowId || rowIds.has(g.rowId)));
  return { ...step, chips, ghosts };
}

/** The restored state with its chips checked against its own texts and ingredient rows, and the free row at the end of the list. */
export function fitDraft(state: RecipeDraft): RecipeDraft {
  const ingredients = withFreeRow(state.ingredients);
  const rowIds = new Set(ingredients.map((r) => r.id));
  return { ...state, ingredients, steps: state.steps.map((s) => fitStep(s, rowIds)) };
}

export type Start = {
  /** What the editor shows when it opens. */
  state: RecipeDraft;
  /** The version of the stored recipe the state is based on. */
  base: { updatedAt?: string };
  /** When the restored draft was kept; none when the editor starts from the stored recipe. */
  restoredAt?: string;
  /** The restored draft was started from another version of the stored recipe than the current one. */
  changedMeanwhile: boolean;
  /** The draft on the device must be removed. */
  discard: boolean;
};

/**
 * How the editor opens. `shown` is what it shows without a draft, `updatedAt` the stored recipe's current version (none for a new recipe), `draft` what the device holds for it.
 * The edit link (`fresh`) throws the draft away. Otherwise a draft is restored, and flagged when its base is not the current version.
 */
export function resolveStart({
  draft,
  fresh,
  shown,
  updatedAt,
}: {
  draft?: StoredDraft;
  fresh: boolean;
  shown: RecipeDraft;
  updatedAt?: string;
}): Start {
  if (fresh) return { state: shown, base: { updatedAt }, changedMeanwhile: false, discard: true };
  if (!draft) return { state: shown, base: { updatedAt }, changedMeanwhile: false, discard: false };
  return {
    state: fitDraft(draft.state),
    base: draft.base,
    restoredAt: draft.savedAt,
    changedMeanwhile: draft.base.updatedAt !== updatedAt,
    discard: false,
  };
}

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

/** When a draft was kept, for the save bar: "vandaag 14:32", "gisteren 09:10", else the date. */
export function describeSavedAt(savedAt: string, now: Date): string {
  const at = new Date(savedAt);
  const time = at.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  if (sameDay(at, now)) return `vandaag ${time}`;
  if (sameDay(at, new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1))) return `gisteren ${time}`;
  return at.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' });
}

/** Whether leaving the page must be confirmed: only for unsaved changes that are not on the device. `keepNow` writes the draft and tells whether that worked, and is only called when it matters. */
export const asksBeforeLeaving = ({ dirty, submitting }: { dirty: boolean; submitting: boolean }, keepNow: () => boolean) =>
  dirty && !submitting && !keepNow();
