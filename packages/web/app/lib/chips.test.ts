import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  acceptProposal,
  addChip,
  canAdd,
  classifyStored,
  contextFor,
  derive,
  discardProposal,
  editValues,
  proposal,
  proposals,
  reconcile,
  removeChip,
  restoreGhost,
  rowsOf,
  setLabel,
  setMode,
  toStored,
  usedIn,
  type Chip,
  type Context,
  type StepChips,
} from './chips';

const rowsFor = (...lines: string[]) => rowsOf(lines.map((text, i) => ({ id: `r${i}`, text })));
const alone = (...lines: string[]): Context => ({ rows: rowsFor(...lines), others: [] });

/** A step as the editor has it after the text was typed in one go. */
const typed = (body: string, ctx: Context): StepChips => reconcile({ body, chips: [], ghosts: [] }, ctx);
/** Replaces `removed` characters at `at` by `insert`, like an edit in the text field. */
const edit = (step: StepChips, ctx: Context, at: number, removed: number, insert: string) =>
  reconcile({ ...step, body: step.body.slice(0, at) + insert + step.body.slice(at + removed) }, ctx, { start: at, removed, inserted: insert.length });
/** Replaces the first occurrence of `from` by `to`. */
const rewrite = (step: StepChips, ctx: Context, from: string, to: string) => edit(step, ctx, step.body.indexOf(from), from.length, to);

const chipOf = (step: StepChips, kind: Chip['kind']) => step.chips.find((c) => c.kind === kind)!;
const shown = (step: StepChips, ctx: Context, kind: Chip['kind']) => derive(chipOf(step, kind), step.body, ctx);
const words = (step: StepChips, kind: Chip['kind']) => step.body.slice(chipOf(step, kind).anchor!.start, chipOf(step, kind).anchor!.end);

test('recipe-step-chips › Typing a duration creates a timer chip', () => {
  const ctx = alone();
  let step = typed('Laat het deeg rusten', ctx);
  assert.equal(step.chips.length, 0);
  step = edit(step, ctx, step.body.length, 0, ' 30 minuten');
  assert.deepEqual(shown(step, ctx, 'timer'), { minutes: 30 });
  assert.equal(chipOf(step, 'timer').mode, 'auto');
  // Character by character: the chip appears when the word is complete and then keeps its identity.
  let slow = typed('Laat 30 ', ctx);
  for (const ch of 'minuten') slow = edit(slow, ctx, slow.body.length, 0, ch);
  assert.deepEqual(shown(slow, ctx, 'timer'), { minutes: 30 });
});

test('recipe-step-chips › Editing the words updates the chip', () => {
  const ctx = alone();
  const before = typed('Laat 30 minuten rusten', ctx);
  const after = rewrite(before, ctx, '30', '45');
  assert.equal(chipOf(after, 'timer').id, chipOf(before, 'timer').id);
  assert.deepEqual(shown(after, ctx, 'timer'), { minutes: 45 });
  assert.equal(words(after, 'timer'), '45 minuten');
});

test('recipe-step-chips › Removing the words removes the chip', () => {
  const ctx = alone();
  const step = typed('Laat 30 minuten rusten', ctx);
  assert.equal(edit(step, ctx, 5, 10, '').chips.length, 0);
  // Words that stop saying a duration do too.
  assert.equal(rewrite(step, ctx, 'minuten', 'gram').chips.length, 0);
});

test('recipe-step-chips › A changed list amount updates the chips', () => {
  const step = typed('Zeef de bloem.', alone('250 g bloem'));
  assert.deepEqual(shown(step, alone('250 g bloem'), 'ingredient'), { quantity: '250 g', name: 'bloem' });
  const changed = alone('300 g bloem');
  const following = reconcile(step, changed);
  assert.deepEqual(shown(following, changed, 'ingredient'), { quantity: '300 g', name: 'bloem' });
  // A pinned chip keeps its own amount, and proposes the new one.
  const pinned = setMode(step, step.chips[0].id, 'manual', alone('250 g bloem'));
  const after = reconcile(pinned, changed);
  assert.deepEqual(shown(after, changed, 'ingredient'), { quantity: '250 g', name: 'bloem' });
});

test('recipe-step-chips › A removed or renamed list row updates the chips', () => {
  const ctx = alone('250 g bloem');
  const step = typed('Zeef de bloem.', ctx);
  const pinned = setMode(step, step.chips[0].id, 'manual', ctx);
  for (const gone of [alone(), alone('250 g pasta')]) {
    assert.equal(reconcile(step, gone).chips.length, 0, 'a following chip is removed');
    const kept = reconcile(pinned, gone);
    assert.deepEqual(shown(kept, gone, 'ingredient'), { quantity: '250 g', name: 'bloem' });
    assert.equal(chipOf(kept, 'ingredient').rowId, undefined, 'a pinned chip stops following the list');
    assert.equal(proposal(chipOf(kept, 'ingredient'), kept.body, gone), undefined);
  }
});

test('recipe-step-chips › Pinning freezes the values', () => {
  const ctx = alone();
  const step = typed('Laat 30 minuten rusten', ctx);
  const pinned = setMode(step, step.chips[0].id, 'manual', ctx);
  assert.equal(chipOf(pinned, 'timer').mode, 'manual');
  assert.deepEqual(shown(pinned, ctx, 'timer'), { minutes: 30 });
  assert.deepEqual(shown(rewrite(pinned, ctx, '30', '45'), ctx, 'timer'), { minutes: 30 });
  assert.deepEqual(shown(edit(pinned, ctx, 5, 10, ''), ctx, 'timer'), { minutes: 30 });
});

const pinnedTimer = () => {
  const ctx = alone();
  const step = typed('Laat 30 minuten rusten', ctx);
  return { ctx, step: setMode(step, step.chips[0].id, 'manual', ctx) };
};

test('recipe-step-chips › A pinned chip proposes changes instead of making them', () => {
  const { ctx, step } = pinnedTimer();
  const changed = rewrite(step, ctx, '30', '45');
  assert.deepEqual(shown(changed, ctx, 'timer'), { minutes: 30 });
  assert.deepEqual(proposal(chipOf(changed, 'timer'), changed.body, ctx), { type: 'change', values: { minutes: 45 } });
  assert.equal(proposals(changed, ctx).length, 1);
  assert.equal(proposal(chipOf(step, 'timer'), step.body, ctx), undefined);
});

test('recipe-step-chips › Accepting a proposed change', () => {
  const { ctx, step } = pinnedTimer();
  const accepted = acceptProposal(rewrite(step, ctx, '30', '45'), step.chips[0].id, ctx);
  assert.deepEqual(shown(accepted, ctx, 'timer'), { minutes: 45 });
  assert.equal(chipOf(accepted, 'timer').mode, 'manual');
  assert.equal(proposals(accepted, ctx).length, 0);
});

test('recipe-step-chips › Discarding a proposed change', () => {
  const { ctx, step } = pinnedTimer();
  const discarded = discardProposal(rewrite(step, ctx, '30', '45'), step.chips[0].id, ctx);
  assert.deepEqual(shown(discarded, ctx, 'timer'), { minutes: 30 });
  assert.equal(proposals(discarded, ctx).length, 0);
  // Editing elsewhere does not bring it back, other words do.
  assert.equal(proposals(edit(discarded, ctx, 0, 0, 'Dan: '), ctx).length, 0);
  assert.equal(proposals(rewrite(discarded, ctx, '45', '50'), ctx).length, 1);
});

test('recipe-step-chips › A pinned chip proposes its removal', () => {
  const { ctx, step } = pinnedTimer();
  for (const changed of [edit(step, ctx, 5, 10, ''), rewrite(step, ctx, 'minuten', 'gram')]) {
    assert.equal(changed.chips.length, 1);
    assert.deepEqual(proposal(chipOf(changed, 'timer'), changed.body, ctx), { type: 'remove' });
  }
});

test('recipe-step-chips › Accepting a proposed removal', () => {
  const { ctx, step } = pinnedTimer();
  const accepted = acceptProposal(edit(step, ctx, 5, 10, ''), step.chips[0].id, ctx);
  assert.equal(accepted.chips.length, 0);
  assert.equal(accepted.ghosts.length, 0);
});

test('recipe-step-chips › Discarding a proposed removal', () => {
  const { ctx, step } = pinnedTimer();
  for (const changed of [edit(step, ctx, 5, 10, ''), rewrite(step, ctx, 'minuten', 'gram')]) {
    const discarded = discardProposal(changed, step.chips[0].id, ctx);
    assert.equal(discarded.chips.length, 1);
    assert.equal(chipOf(discarded, 'timer').mode, 'manual');
    assert.equal(chipOf(discarded, 'timer').anchor, undefined);
    assert.equal(proposals(discarded, ctx).length, 0);
    assert.deepEqual(shown(discarded, ctx, 'timer'), { minutes: 30 });
  }
});

test('recipe-step-chips › Following the text again', () => {
  const { ctx, step } = pinnedTimer();
  const changed = rewrite(step, ctx, '30', '45');
  const following = setMode(changed, step.chips[0].id, 'auto', ctx);
  assert.equal(chipOf(following, 'timer').mode, 'auto');
  assert.deepEqual(shown(following, ctx, 'timer'), { minutes: 45 });
  assert.deepEqual(shown(rewrite(following, ctx, '45', '20'), ctx, 'timer'), { minutes: 20 });
  // Words that say nothing cannot be followed.
  assert.equal(setMode(edit(step, ctx, 5, 10, ''), step.chips[0].id, 'auto', ctx).chips[0].mode, 'manual');
});

test('recipe-step-chips › Editing a value pins the chip', () => {
  const ctx = alone('250 g bloem');
  const step = typed('Zeef de bloem. Bak 30 minuten op 180 graden.', ctx);
  const timer = editValues(step, chipOf(step, 'timer').id, { minutes: 40 }, ctx);
  assert.equal(chipOf(timer, 'timer').mode, 'manual');
  assert.deepEqual(shown(timer, ctx, 'timer'), { minutes: 40 });
  assert.equal(proposals(timer, ctx).length, 0, 'the words the value was changed against are not proposed back');
  const oven = editValues(timer, chipOf(step, 'oven').id, { degrees: 200 }, ctx);
  assert.deepEqual(shown(oven, ctx, 'oven'), { degrees: 200 });
  const bloem = editValues(oven, chipOf(step, 'ingredient').id, { quantity: '1 kg' }, ctx);
  assert.deepEqual(shown(bloem, ctx, 'ingredient'), { quantity: '1 kg', name: 'bloem' });
  assert.equal(chipOf(bloem, 'ingredient').mode, 'manual');
  // When the words change, the difference is proposed.
  assert.equal(proposals(rewrite(bloem, ctx, '30', '35'), ctx).length, 1);
});

test('recipe-step-chips › Hand-made chips cannot follow the text', () => {
  const ctx = alone();
  const step = addChip(typed('Roer goed.', ctx), 'timer');
  const chip = chipOf(step, 'timer');
  assert.equal(chip.mode, 'manual');
  assert.equal(chip.anchor, undefined);
  assert.equal(setMode(step, chip.id, 'auto', ctx), step);
});

test('timer names never pin and are not read from the text', () => {
  const ctx = alone();
  const step = typed('Laat 30 minuten rusten', ctx);
  const named = setLabel(step, step.chips[0].id, 'Deeg rust');
  assert.equal(chipOf(named, 'timer').mode, 'auto');
  assert.equal(chipOf(rewrite(named, ctx, '30', '45'), 'timer').label, 'Deeg rust');
  assert.equal(chipOf(setLabel(named, step.chips[0].id, ''), 'timer').label, undefined);
});

test('an ingredient written in two steps shows no amount in either', () => {
  const rows = rowsFor('150 g boter');
  const bodies = ['Smelt de boter.', 'Voeg boter toe.'];
  const steps = bodies.map((body, i) => typed(body, contextFor(rows, bodies, i)));
  steps.forEach((s, i) => assert.deepEqual(shown(s, contextFor(rows, bodies, i), 'ingredient'), { quantity: '', name: 'boter' }));
  const only = typed(bodies[0], contextFor(rows, [bodies[0], 'Bak.'], 0));
  assert.deepEqual(shown(only, contextFor(rows, [bodies[0], 'Bak.'], 0), 'ingredient'), { quantity: '150 g', name: 'boter' });
});

// Ghosts

test('recipe-step-chips › Removing an anchored chip leaves a ghost', () => {
  const ctx = alone();
  const step = typed('Laat 30 minuten rusten', ctx);
  const removed = removeChip(step, step.chips[0].id, ctx);
  assert.equal(removed.chips.length, 0);
  assert.equal(removed.body, step.body);
  assert.equal(removed.ghosts.length, 1);
  assert.equal(removed.ghosts[0].kind, 'timer');
  assert.deepEqual(removed.ghosts[0].anchor, step.chips[0].anchor);
});

test('recipe-step-chips › Restoring a ghost', () => {
  const ctx = alone();
  const step = typed('Laat 30 minuten rusten', ctx);
  const restored = restoreGhost(removeChip(step, step.chips[0].id, ctx), step.chips[0].id, ctx);
  assert.equal(restored.ghosts.length, 0);
  assert.equal(chipOf(restored, 'timer').mode, 'auto');
  assert.deepEqual(shown(restored, ctx, 'timer'), { minutes: 30 });
  assert.deepEqual(restored.chips[0].anchor, step.chips[0].anchor);
});

test('recipe-step-chips › A ghost is not recreated by the text', () => {
  const ctx = alone();
  const step = typed('Laat 30 minuten rusten', ctx);
  const removed = removeChip(step, step.chips[0].id, ctx);
  const later = edit(edit(removed, ctx, 0, 0, 'Eerst '), ctx, removed.body.length + 6, 0, ' goed');
  assert.equal(later.chips.length, 0);
  assert.equal(later.ghosts.length, 1);
  assert.equal(later.body.slice(later.ghosts[0].anchor.start, later.ghosts[0].anchor.end), '30 minuten');
  // A removed ingredient chip is held the same way.
  const bloem = alone('250 g bloem');
  const zeef = typed('Zeef de bloem.', bloem);
  const gone = removeChip(zeef, zeef.chips[0].id, bloem);
  assert.equal(edit(gone, bloem, 0, 0, 'Dan: ').chips.length, 0);
});

test('recipe-step-chips › A ghost disappears with its words', () => {
  const ctx = alone();
  const step = typed('Laat 30 minuten rusten', ctx);
  const removed = removeChip(step, step.chips[0].id, ctx);
  assert.equal(edit(removed, ctx, 5, 10, '').ghosts.length, 0);
  assert.equal(rewrite(removed, ctx, 'minuten', 'gram').ghosts.length, 0);
  // After that the slot is free again.
  assert.equal(chipOf(rewrite(edit(removed, ctx, 5, 10, ''), ctx, 'rusten', 'rusten 10 minuten'), 'timer').mode, 'auto');
});

test('recipe-step-chips › Removing a hand-made chip leaves nothing', () => {
  const ctx = alone();
  const step = addChip(typed('Roer goed.', ctx), 'oven');
  const removed = removeChip(step, step.chips[0].id, ctx);
  assert.equal(removed.chips.length, 0);
  assert.equal(removed.ghosts.length, 0);
});

test('recipe-step-chips › A hand-made chip is pinned and has no words', () => {
  const ctx = alone();
  const step = addChip(typed('Roer goed.', ctx), 'timer');
  const made = editValues(step, step.chips[0].id, { minutes: 15 }, ctx);
  assert.equal(made.chips.length, 1);
  assert.equal(chipOf(made, 'timer').mode, 'manual');
  assert.equal(chipOf(made, 'timer').anchor, undefined);
  assert.deepEqual(shown(made, ctx, 'timer'), { minutes: 15 });
  // It holds the slot, so words that look like a timer do not create another.
  assert.equal(edit(made, ctx, 0, 0, 'Wacht 10 minuten. ').chips.length, 1);
});

test('recipe-step-chips › One oven and one timer per step', () => {
  const ctx = alone();
  const step = typed('Bak 30 minuten op 180 graden.', ctx);
  assert.equal(canAdd(step, 'oven'), false);
  assert.equal(canAdd(step, 'timer'), false);
  assert.equal(canAdd(step, 'ingredient'), true);
  assert.equal(addChip(step, 'timer'), step);
  // A ghost counts as well.
  const ghost = removeChip(step, chipOf(step, 'timer').id, ctx);
  assert.equal(canAdd(ghost, 'timer'), false);
  assert.equal(canAdd(typed('Roer.', ctx), 'timer'), true);
});

// Saving and restoring

test('recipe-step-chips › A pinned chip is saved with its pinned values', () => {
  const ctx = alone('250 g bloem');
  const step = typed('Zeef de bloem. Bak 30 minuten op 180 graden.', ctx);
  const timer = setLabel(setMode(step, chipOf(step, 'timer').id, 'manual', ctx), chipOf(step, 'timer').id, 'Bakken');
  const changed = rewrite(timer, ctx, '30 minuten', '45 minuten');
  assert.equal(proposals(changed, ctx).length, 1);
  assert.deepEqual(toStored(changed, ctx), {
    body: 'Zeef de bloem. Bak 45 minuten op 180 graden.',
    ingredients: [{ quantity_text: '250 g', name: 'bloem' }],
    ovenTemperature: 180,
    timer: { minutes: 30, label: 'Bakken' },
  });
});

test("recipe-step-chips › The timer's name does not pin it", () => {
  const ctx = alone();
  const step = typed('Laat 30 minuten rusten', ctx);
  const named = setLabel(step, step.chips[0].id, 'Deeg rust');
  assert.equal(chipOf(named, 'timer').mode, 'auto');
  const stored = toStored(rewrite(named, ctx, '30', '45'), ctx);
  assert.deepEqual(stored.timer, { minutes: 45, label: 'Deeg rust' });
  // Opened again: the name is kept and the chip still follows the text.
  const again = classifyStored(stored, ctx);
  assert.equal(chipOf(again, 'timer').mode, 'auto');
  assert.equal(chipOf(again, 'timer').label, 'Deeg rust');
});

test('saving leaves out what is not valid', () => {
  const ctx = alone();
  let step = addChip(addChip(addChip(typed('Roer.', ctx), 'ingredient'), 'oven'), 'timer');
  assert.deepEqual(toStored(step, ctx).ingredients, [], 'an ingredient chip without a name is not stored');
  step = editValues(step, chipOf(step, 'oven').id, { degrees: 0 }, ctx);
  step = editValues(step, chipOf(step, 'timer').id, { minutes: 2.5 }, ctx);
  const stored = toStored(step, ctx);
  assert.equal(stored.ovenTemperature, undefined);
  assert.equal(stored.timer, undefined);
  // The plausible range only drives recognition: a hand-made 40 degrees is kept.
  assert.equal(toStored(editValues(step, chipOf(step, 'oven').id, { degrees: 40 }, ctx), ctx).ovenTemperature, 40);
});

test('recipe-step-chips › A stored chip that matches its text follows it', () => {
  const ctx = alone('250 g bloem');
  const step = classifyStored(
    {
      body: 'Zeef de bloem. Bak 30 minuten op 180 graden.',
      ingredients: [{ quantity_text: '250 g', name: 'bloem' }],
      ovenTemperature: 180,
      timer: { minutes: 30 },
    },
    ctx,
  );
  assert.deepEqual(
    step.chips.map((c) => c.mode),
    ['auto', 'auto', 'auto'],
  );
  assert.equal(words(step, 'timer'), '30 minuten');
  assert.equal(words(step, 'oven'), '180 graden');
  assert.equal(words(step, 'ingredient'), 'bloem');
  assert.equal(chipOf(step, 'ingredient').rowId, 'r0');
  assert.equal(step.ghosts.length, 0);
});

test('recipe-step-chips › A stored chip that differs is pinned', () => {
  const ctx = alone('250 g bloem');
  const step = classifyStored(
    {
      body: 'Zeef de bloem. Bak 30 minuten op 180 graden.',
      ingredients: [{ quantity_text: '100 g', name: 'bloem' }],
      ovenTemperature: 200,
      timer: { minutes: 40 },
    },
    ctx,
  );
  assert.deepEqual(
    step.chips.map((c) => c.mode),
    ['manual', 'manual', 'manual'],
  );
  assert.deepEqual(shown(step, ctx, 'timer'), { minutes: 40 });
  assert.deepEqual(proposal(chipOf(step, 'timer'), step.body, ctx), { type: 'change', values: { minutes: 30 } });
  assert.deepEqual(proposal(chipOf(step, 'oven'), step.body, ctx), { type: 'change', values: { degrees: 180 } });
  assert.deepEqual(proposal(chipOf(step, 'ingredient'), step.body, ctx), { type: 'change', values: { quantity: '250 g', name: 'bloem' } });
  assert.equal(proposals(step, ctx).length, 3);
});

test('recipe-step-chips › A stored chip without matching words is pinned without words', () => {
  const ctx = alone('250 g bloem');
  const step = classifyStored(
    {
      body: 'Verwarm de oven voor.',
      ingredients: [
        { quantity_text: '1 scheutje', name: 'citroensap' },
        { quantity_text: '250 g', name: 'bloem' },
      ],
      ovenTemperature: 180,
      timer: { minutes: 20, label: 'Wachten' },
    },
    ctx,
  );
  assert.equal(step.chips.length, 4);
  for (const chip of step.chips) {
    assert.equal(chip.mode, 'manual');
    assert.equal(chip.anchor, undefined);
  }
  assert.equal(step.chips.find((c) => c.kind === 'ingredient' && c.values.name === 'citroensap')?.rowId, undefined);
  assert.equal(step.chips.find((c) => c.kind === 'ingredient' && c.values.name === 'bloem')?.rowId, 'r0', 'linked to the row all the same');
  assert.equal(proposals(step, ctx).length, 0);
});

test('words that say something no stored chip has get a ghost when a recipe is opened', () => {
  const ctx = alone('250 g bloem');
  const step = classifyStored({ body: 'Zeef de bloem. Bak 30 minuten op 180 graden.', ingredients: [] }, ctx);
  assert.equal(step.chips.length, 0);
  assert.deepEqual(step.ghosts.map((g) => g.kind).sort(), ['ingredient', 'oven', 'timer']);
  assert.equal(edit(step, ctx, 0, 0, 'Dan ').chips.length, 0);
});

test('a stored ingredient is linked by name, by its last word, and to a row only once', () => {
  const ctx = alone('2 eieren', '1 kg zure appels', '100 g boter');
  const step = classifyStored(
    {
      body: 'Klop het ei. Schil een appel.',
      ingredients: [
        { quantity_text: '1', name: 'ei' },
        { quantity_text: '1', name: 'appel' },
        { quantity_text: '2', name: 'eieren' },
        { quantity_text: '', name: 'ZURE APPELS' },
      ],
    },
    ctx,
  );
  assert.deepEqual(
    step.chips.map((c) => c.rowId),
    ['r0', 'r1', undefined, undefined],
  );
  assert.equal(classifyStored({ body: 'x', ingredients: [{ quantity_text: '', name: 'zure appels' }] }, ctx).chips[0].rowId, 'r1');
});

test('recipe-step-chips › Usage line lists the steps', () => {
  const rows = rowsFor('1 tl zout', '1 ei');
  const bodies = ['Voeg zout toe.', 'Roer.', 'Bak.', 'Wacht.', 'Strooi zout.'];
  const steps = bodies.map((body, i) => typed(body, contextFor(rows, bodies, i)));
  assert.deepEqual(usedIn(steps, 'r0'), [1, 5]);
});

test('recipe-step-chips › Unused ingredient has no usage line', () => {
  const rows = rowsFor('1 tl zout', '1 ei');
  const bodies = ['Voeg zout toe.', 'Roer.'];
  const steps = bodies.map((body, i) => typed(body, contextFor(rows, bodies, i)));
  assert.deepEqual(usedIn(steps, 'r1'), []);
});
