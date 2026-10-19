import { mapRange, type Range } from '~/lib/anchors';
import { parseIngredient } from '~/lib/ingredients';
import type { Step } from '~/lib/recipes';
import {
  findIngredients,
  findOven,
  findTimer,
  sameWord,
  type IngredientValues,
  type OvenValues,
  type Row,
  type TimerValues,
} from '~/lib/stepParsers';
import type { TextEdit } from '~/lib/textEdit';

export type Kind = 'ingredient' | 'oven' | 'timer';
export type { IngredientValues, OvenValues, TimerValues };
type ValuesOf = { ingredient: IngredientValues; oven: OvenValues; timer: TimerValues };
export type Values = ValuesOf[Kind];

type Fields<K extends Kind> = {
  id: string;
  kind: K;
  /** `auto` follows the text: its values are read from its words every time. `manual` (pinned) keeps `values`. */
  mode: 'auto' | 'manual';
  /** The words the chip is tied to; a hand-made chip has none. */
  anchor?: Range;
  /** A pinned chip whose words were taken away: it proposes its own removal. */
  lost?: true;
  /** The ingredient row an ingredient chip is linked to. */
  rowId?: string;
  values: ValuesOf[K];
  /** A discarded proposal, which is not offered again until the words say something else. */
  ignored?: ValuesOf[K];
  /** A timer's name; never part of a comparison. */
  label?: string;
};
export type Chip = { [K in Kind]: Fields<K> }[Kind];

/** A chip with anchor words that was removed; it stops the text from creating the chip again, and can be brought back. */
export type Ghost = { id: string; kind: Kind; anchor: Range; rowId?: string };

/** What the chip logic needs of a step. */
export type StepChips = { body: string; chips: Chip[]; ghosts: Ghost[] };

/** What a step's chips are read against: the ingredient rows of the recipe. */
export type Context = { rows: Row[] };

/** The rows of the ingredient list that have a name, in the form the finders take. */
export const rowsOf = (lines: { id: string; text: string }[]): Row[] =>
  lines.flatMap(({ id, text }) => {
    const { quantityText, name } = parseIngredient(text);
    return name ? [{ id, quantityText, name }] : [];
  });

/** The amount of a row when no written one is there: its own quantity, whatever number of steps mention it. */
const quantityOf = (row: Row) => row.quantityText;

const textOf = (body: string, range?: Range) => (range ? body.slice(range.start, range.end) : '');
/** Whether two sets of values are the same, whatever the order of their keys. */
const sameValues = (a: Values, b: Values) => {
  const x = a as Record<string, unknown>;
  const y = b as Record<string, unknown>;
  const keys = Object.keys(x);
  return keys.length === Object.keys(y).length && keys.every((key) => x[key] === y[key]);
};

/** What words say for a kind of chip (and a row, for an ingredient), or undefined when they say nothing of that kind. */
function read({ kind, rowId }: { kind: Kind; rowId?: string }, words: string, ctx: Context): Values | undefined {
  if (kind === 'timer') return findTimer(words)?.values;
  if (kind === 'oven') return findOven(words)?.values;
  const row = ctx.rows.find((r) => r.id === rowId);
  return row && findIngredients(words, [row], quantityOf)[0]?.values;
}

/** The values a chip shows: a following chip reads its words (and keeps its last values if they say nothing), a pinned chip has its own. */
export function derive(chip: Chip, body: string, ctx: Context): Values {
  return (chip.mode === 'auto' && chip.anchor && read(chip, textOf(body, chip.anchor), ctx)) || chip.values;
}

export type Proposal = { type: 'change'; values: Values } | { type: 'remove' };

/** What a pinned chip suggests after its words changed: a new value, or its removal. Nothing for a following chip, a hand-made one, or a suggestion that was discarded. */
export function proposal(chip: Chip, body: string, ctx: Context): Proposal | undefined {
  if (chip.mode !== 'manual') return undefined;
  if (chip.lost) return { type: 'remove' };
  if (!chip.anchor) return undefined;
  const said = read(chip, textOf(body, chip.anchor), ctx);
  if (!said) return { type: 'remove' };
  return sameValues(said, chip.values) || (chip.ignored && sameValues(said, chip.ignored)) ? undefined : { type: 'change', values: said };
}

/** The id the next chip or ghost of the step gets. */
export const nextChipId = (step: Pick<StepChips, 'chips' | 'ghosts'>) =>
  `c${Math.max(-1, ...[...step.chips, ...step.ghosts].map((c) => Number(c.id.slice(1)))) + 1}`;

const autoChip = (id: string, kind: Kind, anchor: Range, values: Values, rowId?: string) =>
  ({ id, kind, mode: 'auto', anchor, rowId, values }) as Chip;
const range = ({ start, end }: Range): Range => ({ start, end });

/**
 * Brings the chips of a step in line with its text and the ingredient list. `step.body` is the new text; when `edit` is given, the anchors are still where they were before that edit.
 * Following chips take the first match of their kind (and row) in the text, so the finder has the last word, and go when there is none. Pinned chips keep their anchors and never change by themselves. Ghosts go with their words. Words that say something no chip or ghost holds yet get a new following chip.
 * With `rowsChanged` (the default when there is no edit) it handles a change of the ingredient list: pinned chips linked to a row that is gone, or that no longer matches their words, stop following the list. Any other call leaves them alone, so a proposed removal stays open until the user answers it.
 */
export function reconcile<S extends StepChips>(step: S, ctx: Context, edit?: TextEdit, rowsChanged = !edit): S {
  const { body } = step;
  const timer = findTimer(body);
  const oven = findOven(body);
  const ingredients = findIngredients(body, ctx.rows, quantityOf);
  const mapped = (anchor?: Range) => anchor && (edit ? mapRange(anchor, edit) : anchor);

  const chips: Chip[] = [];
  for (const chip of step.chips) {
    if (chip.mode === 'auto') {
      const found = chip.kind === 'timer' ? timer : chip.kind === 'oven' ? oven : ingredients.find((i) => i.rowId === chip.rowId);
      if (found) chips.push({ ...chip, anchor: range(found), values: found.values } as Chip);
      continue;
    }
    const anchor = mapped(chip.anchor);
    const lost = chip.lost || (chip.anchor && !anchor ? true : undefined);
    let next = { ...chip, anchor, lost } as Chip;
    if (rowsChanged && chip.rowId && !lost) {
      const unreadable = anchor && !read(chip, textOf(body, anchor), ctx);
      if (!ctx.rows.some((r) => r.id === chip.rowId) || unreadable) next = { ...chip, rowId: undefined, anchor: undefined, ignored: undefined };
    }
    chips.push(next);
  }

  const ghosts = step.ghosts.flatMap((ghost) => {
    const anchor = mapped(ghost.anchor);
    return anchor && read(ghost, textOf(body, anchor), ctx) ? [{ ...ghost, anchor }] : [];
  });

  const held = (kind: Kind, rowId?: string) => [...chips, ...ghosts].some((c) => c.kind === kind && (kind !== 'ingredient' || c.rowId === rowId));
  const add = (kind: Kind, found: Range & { values: Values }, rowId?: string) => {
    if (!held(kind, rowId)) chips.push(autoChip(nextChipId({ chips, ghosts }), kind, range(found), found.values, rowId));
  };
  if (timer) add('timer', timer);
  if (oven) add('oven', oven);
  for (const found of ingredients) add('ingredient', found, found.rowId);

  return { ...step, chips, ghosts };
}

const find = (step: StepChips, id: string) => step.chips.find((c) => c.id === id);
const replace = <S extends StepChips>(step: S, chip: Chip): S => ({ ...step, chips: step.chips.map((c) => (c.id === chip.id ? chip : c)) });

/** Pins a following chip (it keeps what it shows now), or makes a pinned chip with words follow them again (it takes what they say). */
export function setMode<S extends StepChips>(step: S, id: string, mode: 'auto' | 'manual', ctx: Context): S {
  const chip = find(step, id);
  if (!chip || chip.mode === mode) return step;
  if (mode === 'manual') return replace(step, { ...chip, mode, values: derive(chip, step.body, ctx), ignored: undefined } as Chip);
  if (!chip.anchor || chip.lost || !read(chip, textOf(step.body, chip.anchor), ctx)) return step;
  return reconcile(replace(step, { ...chip, mode, ignored: undefined }), ctx, undefined, false);
}

/** Changes values of a chip by hand, which pins it. What its words say now is not proposed back as a change. */
export function editValues<S extends StepChips>(step: S, id: string, patch: Partial<IngredientValues & OvenValues & TimerValues>, ctx: Context): S {
  const chip = find(step, id);
  if (!chip) return step;
  const said = chip.anchor && !chip.lost ? read(chip, textOf(step.body, chip.anchor), ctx) : undefined;
  return replace(step, { ...chip, mode: 'manual', values: { ...derive(chip, step.body, ctx), ...patch }, ignored: said } as Chip);
}

/** Names a timer; an empty name clears it. This never pins the chip. */
export function setLabel<S extends StepChips>(step: S, id: string, label: string): S {
  const chip = find(step, id);
  return chip?.kind === 'timer' ? replace(step, { ...chip, label: label || undefined }) : step;
}

/** Removes a chip. One with anchor words leaves a ghost, so that its words do not bring it back; a hand-made one leaves nothing. */
export function removeChip<S extends StepChips>(step: S, id: string, ctx: Context): S {
  const chip = find(step, id);
  if (!chip) return step;
  const ghosts = chip.anchor && !chip.lost ? [...step.ghosts, { id: chip.id, kind: chip.kind, anchor: chip.anchor, rowId: chip.rowId }] : step.ghosts;
  return reconcile({ ...step, chips: step.chips.filter((c) => c !== chip), ghosts }, ctx, undefined, false);
}

/** Brings a ghost back as a following chip. */
export function restoreGhost<S extends StepChips>(step: S, id: string, ctx: Context): S {
  const ghost = step.ghosts.find((g) => g.id === id);
  if (!ghost) return step;
  const values = read(ghost, textOf(step.body, ghost.anchor), ctx);
  const ghosts = step.ghosts.filter((g) => g !== ghost);
  if (!values) return { ...step, ghosts };
  return reconcile(
    { ...step, chips: [...step.chips, autoChip(ghost.id, ghost.kind, ghost.anchor, values, ghost.rowId)], ghosts },
    ctx,
    undefined,
    false,
  );
}

/** Whether the add row may offer this kind: an oven and a timer only once per step, counting ghosts. */
export const canAdd = (step: StepChips, kind: Kind) => kind === 'ingredient' || ![...step.chips, ...step.ghosts].some((c) => c.kind === kind);

const blankValues: ValuesOf = { ingredient: { quantity: '', name: '' }, oven: { degrees: 180 }, timer: { minutes: 15 } };

/** Adds a hand-made chip: pinned, without words, with the given id. */
export function addChip<S extends StepChips>(step: S, kind: Kind, id: string): S {
  if (!canAdd(step, kind)) return step;
  const chip = { id, kind, mode: 'manual', values: blankValues[kind] } as Chip;
  return { ...step, chips: [...step.chips, chip] };
}

/** Takes over the proposal of a pinned chip: new values, or removal (no ghost). */
export function acceptProposal<S extends StepChips>(step: S, id: string, ctx: Context): S {
  const chip = find(step, id);
  const suggestion = chip && proposal(chip, step.body, ctx);
  if (!chip || !suggestion) return step;
  if (suggestion.type === 'remove') return reconcile({ ...step, chips: step.chips.filter((c) => c !== chip) }, ctx, undefined, false);
  return replace(step, { ...chip, values: suggestion.values, ignored: undefined } as Chip);
}

/** Turns a proposal down: the chip keeps its values, a change is not offered again for the same words, and a chip whose words are gone stays without them. */
export function discardProposal<S extends StepChips>(step: S, id: string, ctx: Context): S {
  const chip = find(step, id);
  const suggestion = chip && proposal(chip, step.body, ctx);
  if (!chip || !suggestion) return step;
  if (suggestion.type === 'remove') return replace(step, { ...chip, anchor: undefined, lost: undefined, ignored: undefined } as Chip);
  return replace(step, { ...chip, ignored: suggestion.values } as Chip);
}

/** The chips with a proposal open, in the order of the chips. */
export const proposals = (step: StepChips, ctx: Context) => step.chips.filter((c) => proposal(c, step.body, ctx));

/** A whole, positive number of degrees or minutes (an ingredient has neither and passes). */
const positive = (values: Values) => Object.values(values).every((v) => typeof v !== 'number' || (Number.isInteger(v) && v > 0));

/** The step as it is stored and shown on the recipe page: following chips with what their words say, pinned chips with their own values, open proposals ignored, at most one oven and one timer. */
export function toStored(step: StepChips, ctx: Context): Step {
  const shown = step.chips.map((chip) => ({ chip, values: derive(chip, step.body, ctx) }));
  const first = (kind: Kind) => shown.find((s) => s.chip.kind === kind && positive(s.values));
  const oven = first('oven');
  const timer = first('timer');
  const label = timer?.chip.label?.trim();
  return {
    body: step.body,
    ingredients: shown.flatMap(({ chip, values }) => {
      const { quantity, name } = values as IngredientValues;
      return chip.kind === 'ingredient' && name.trim() ? [{ quantity_text: quantity.trim(), name: name.trim() }] : [];
    }),
    ...(oven && { ovenTemperature: (oven.values as OvenValues).degrees }),
    ...(timer && { timer: { minutes: (timer.values as TimerValues).minutes, ...(label && { label }) } }),
  };
}

const lastWord = (name: string) => name.trim().split(/\s+/).at(-1) ?? '';

/**
 * Ties the chips of a stored step to its words again when a recipe is opened. A chip that equals what its words say follows them; any other is pinned, with the words when there are some. Words that say something no stored chip has get a ghost, so that the text does not bring back what was removed.
 */
export function classifyStored(stored: Step, ctx: Context): StepChips {
  const { body } = stored;
  const chips: Chip[] = [];
  const ghosts: Ghost[] = [];
  const id = () => nextChipId({ chips, ghosts });

  const single = <K extends 'oven' | 'timer'>(
    kind: K,
    values: ValuesOf[K] | undefined,
    found: (Range & { values: ValuesOf[K] }) | undefined,
    label?: string,
  ) => {
    if (!values) {
      if (found) ghosts.push({ id: id(), kind, anchor: range(found) });
      return;
    }
    chips.push({
      id: id(),
      kind,
      mode: found && sameValues(found.values, values) ? 'auto' : 'manual',
      anchor: found && range(found),
      values,
      ...(label && { label }),
    } as Chip);
  };
  single('oven', stored.ovenTemperature ? { degrees: stored.ovenTemperature } : undefined, findOven(body));
  single('timer', stored.timer ? { minutes: stored.timer.minutes } : undefined, findTimer(body), stored.timer?.label);

  const mentions = findIngredients(body, ctx.rows, quantityOf);
  const linked = new Set<string>();
  for (const { quantity_text, name } of stored.ingredients) {
    const free = ctx.rows.filter((r) => !linked.has(r.id));
    const row =
      free.find((r) => r.name.trim().toLowerCase() === name.trim().toLowerCase()) ?? free.find((r) => sameWord(lastWord(r.name), lastWord(name)));
    if (row) linked.add(row.id);
    const mention = row && mentions.find((m) => m.rowId === row.id);
    chips.push({
      id: id(),
      kind: 'ingredient',
      mode: mention && mention.values.quantity === quantity_text && mention.values.name === name ? 'auto' : 'manual',
      anchor: mention && range(mention),
      rowId: row?.id,
      values: { quantity: quantity_text, name },
    });
  }
  for (const m of mentions) if (!linked.has(m.rowId)) ghosts.push({ id: id(), kind: 'ingredient', anchor: range(m), rowId: m.rowId });

  return { body, chips, ghosts };
}

/** The step numbers (from 1) that have a chip linked to the ingredient row. */
export const usedIn = (steps: StepChips[], rowId: string) => steps.flatMap((s, i) => (s.chips.some((c) => c.rowId === rowId) ? [i + 1] : []));
