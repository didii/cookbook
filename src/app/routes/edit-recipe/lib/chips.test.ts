import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { defaultRules } from '~app/shared/rules';
import {
  acceptProposal,
  addChip,
  canAdd,
  classifyStored,
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

const rowsFor = (...lines: string[]) =>
  rowsOf(
    lines.map((text, i) => ({ id: `r${i}`, text })),
    defaultRules,
  );
const alone = (...lines: string[]): Context => ({ rows: rowsFor(...lines), rules: defaultRules });

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

describe('recipe-step-chips › Typing a duration creates a timer chip', () => {
  const ctx = alone();

  test('text without a duration has no chip', () => {
    assert.equal(typed('Laat het deeg rusten', ctx).chips.length, 0);
  });

  test('appending a duration creates a timer that follows the text', () => {
    const step = edit(typed('Laat het deeg rusten', ctx), ctx, 'Laat het deeg rusten'.length, 0, ' 30 minuten');
    assert.deepEqual(shown(step, ctx, 'timer'), { minutes: 30 });
    assert.equal(chipOf(step, 'timer').mode, 'auto');
  });

  // Character by character: the chip appears when the word is complete and then keeps its identity.
  test('typing character by character creates the timer when the word is complete', () => {
    let slow = typed('Laat 30 ', ctx);
    for (const ch of 'minuten') slow = edit(slow, ctx, slow.body.length, 0, ch);
    assert.deepEqual(shown(slow, ctx, 'timer'), { minutes: 30 });
  });
});

describe('recipe-step-chips › Editing the words updates the chip', () => {
  const ctx = alone();
  const before = typed('Laat 30 minuten rusten', ctx);
  const after = rewrite(before, ctx, '30', '45');

  test('the chip keeps its identity', () => {
    assert.equal(chipOf(after, 'timer').id, chipOf(before, 'timer').id);
  });

  test('the chip shows the new value', () => {
    assert.deepEqual(shown(after, ctx, 'timer'), { minutes: 45 });
  });

  test('the chip marks the new words', () => {
    assert.equal(words(after, 'timer'), '45 minuten');
  });
});

describe('recipe-step-chips › Removing the words removes the chip', () => {
  const ctx = alone();
  const step = typed('Laat 30 minuten rusten', ctx);

  test('deleting the words', () => {
    assert.equal(edit(step, ctx, 5, 10, '').chips.length, 0);
  });

  // Words that stop saying a duration do too.
  test('words that stop saying a duration', () => {
    assert.equal(rewrite(step, ctx, 'minuten', 'gram').chips.length, 0);
  });
});

describe('recipe-step-chips › A changed list amount updates the chips', () => {
  const step = typed('Zeef de bloem.', alone('250 g bloem'));
  const changed = alone('300 g bloem');

  test('the original amount is shown at first', () => {
    assert.deepEqual(shown(step, alone('250 g bloem'), 'ingredient'), { quantity: '250 g', name: 'bloem' });
  });

  test('a following chip shows the new amount', () => {
    const following = reconcile(step, changed);
    assert.deepEqual(shown(following, changed, 'ingredient'), { quantity: '300 g', name: 'bloem' });
  });

  // A pinned chip keeps its own amount, and proposes the new one.
  test('a pinned chip keeps its own amount', () => {
    const pinned = setMode(step, step.chips[0].id, 'manual', alone('250 g bloem'));
    const after = reconcile(pinned, changed);
    assert.deepEqual(shown(after, changed, 'ingredient'), { quantity: '250 g', name: 'bloem' });
  });
});

describe('recipe-step-chips › A removed or renamed list row updates the chips', () => {
  const ctx = alone('250 g bloem');
  const step = typed('Zeef de bloem.', ctx);
  const pinned = setMode(step, step.chips[0].id, 'manual', ctx);
  const cases = { removed: alone(), renamed: alone('250 g pasta') };

  for (const [what, gone] of Object.entries(cases)) {
    describe(`the row is ${what}`, () => {
      test('a following chip is removed', () => {
        assert.equal(reconcile(step, gone).chips.length, 0, 'a following chip is removed');
      });

      test('a pinned chip keeps its values', () => {
        assert.deepEqual(shown(reconcile(pinned, gone), gone, 'ingredient'), { quantity: '250 g', name: 'bloem' });
      });

      test('a pinned chip stops following the list', () => {
        assert.equal(chipOf(reconcile(pinned, gone), 'ingredient').rowId, undefined, 'a pinned chip stops following the list');
      });

      test('a pinned chip proposes nothing', () => {
        const kept = reconcile(pinned, gone);
        assert.equal(proposal(chipOf(kept, 'ingredient'), kept.body, gone), undefined);
      });
    });
  }
});

describe('recipe-step-chips › Pinning freezes the values', () => {
  const ctx = alone();
  const step = typed('Laat 30 minuten rusten', ctx);
  const pinned = setMode(step, step.chips[0].id, 'manual', ctx);

  test('the chip is manual', () => {
    assert.equal(chipOf(pinned, 'timer').mode, 'manual');
  });

  test('the value stays', () => {
    assert.deepEqual(shown(pinned, ctx, 'timer'), { minutes: 30 });
  });

  test('changing the words does not change the value', () => {
    assert.deepEqual(shown(rewrite(pinned, ctx, '30', '45'), ctx, 'timer'), { minutes: 30 });
  });

  test('deleting the words does not change the value', () => {
    assert.deepEqual(shown(edit(pinned, ctx, 5, 10, ''), ctx, 'timer'), { minutes: 30 });
  });
});

const pinnedTimer = () => {
  const ctx = alone();
  const step = typed('Laat 30 minuten rusten', ctx);
  return { ctx, step: setMode(step, step.chips[0].id, 'manual', ctx) };
};

describe('recipe-step-chips › A pinned chip proposes changes instead of making them', () => {
  const { ctx, step } = pinnedTimer();
  const changed = rewrite(step, ctx, '30', '45');

  test('the shown value stays', () => {
    assert.deepEqual(shown(changed, ctx, 'timer'), { minutes: 30 });
  });

  test('the chip proposes the new value', () => {
    assert.deepEqual(proposal(chipOf(changed, 'timer'), changed.body, ctx), { type: 'change', values: { minutes: 45 } });
  });

  test('there is one proposal in the step', () => {
    assert.equal(proposals(changed, ctx).length, 1);
  });

  test('an unchanged step proposes nothing', () => {
    assert.equal(proposal(chipOf(step, 'timer'), step.body, ctx), undefined);
  });
});

describe('recipe-step-chips › Accepting a proposed change', () => {
  const { ctx, step } = pinnedTimer();
  const accepted = acceptProposal(rewrite(step, ctx, '30', '45'), step.chips[0].id, ctx);

  test('the chip shows the proposed value', () => {
    assert.deepEqual(shown(accepted, ctx, 'timer'), { minutes: 45 });
  });

  test('the chip stays pinned', () => {
    assert.equal(chipOf(accepted, 'timer').mode, 'manual');
  });

  test('no proposal is left', () => {
    assert.equal(proposals(accepted, ctx).length, 0);
  });
});

describe('recipe-step-chips › Discarding a proposed change', () => {
  const { ctx, step } = pinnedTimer();
  const discarded = discardProposal(rewrite(step, ctx, '30', '45'), step.chips[0].id, ctx);

  test('the chip keeps its value', () => {
    assert.deepEqual(shown(discarded, ctx, 'timer'), { minutes: 30 });
  });

  test('no proposal is left', () => {
    assert.equal(proposals(discarded, ctx).length, 0);
  });

  // Editing elsewhere does not bring it back, other words do.
  test('editing elsewhere does not bring it back', () => {
    assert.equal(proposals(edit(discarded, ctx, 0, 0, 'Dan: '), ctx).length, 0);
  });

  test('other words do bring a proposal', () => {
    assert.equal(proposals(rewrite(discarded, ctx, '45', '50'), ctx).length, 1);
  });
});

describe('recipe-step-chips › A pinned chip proposes its removal', () => {
  const { ctx, step } = pinnedTimer();
  const cases = {
    'deleting the words': edit(step, ctx, 5, 10, ''),
    'words that stop saying a duration': rewrite(step, ctx, 'minuten', 'gram'),
  };
  for (const [what, changed] of Object.entries(cases)) {
    describe(what, () => {
      test('the chip stays', () => {
        assert.equal(changed.chips.length, 1);
      });

      test('the chip proposes its removal', () => {
        assert.deepEqual(proposal(chipOf(changed, 'timer'), changed.body, ctx), { type: 'remove' });
      });
    });
  }
});

describe('recipe-step-chips › Accepting a proposed removal', () => {
  const { ctx, step } = pinnedTimer();
  const accepted = acceptProposal(edit(step, ctx, 5, 10, ''), step.chips[0].id, ctx);

  test('the chip is gone', () => {
    assert.equal(accepted.chips.length, 0);
  });

  test('no ghost is left', () => {
    assert.equal(accepted.ghosts.length, 0);
  });
});

describe('recipe-step-chips › Discarding a proposed removal', () => {
  const { ctx, step } = pinnedTimer();
  const cases = {
    'deleting the words': edit(step, ctx, 5, 10, ''),
    'words that stop saying a duration': rewrite(step, ctx, 'minuten', 'gram'),
  };
  for (const [what, changed] of Object.entries(cases)) {
    describe(what, () => {
      const discarded = discardProposal(changed, step.chips[0].id, ctx);

      test('the chip stays', () => {
        assert.equal(discarded.chips.length, 1);
      });

      test('the chip stays pinned', () => {
        assert.equal(chipOf(discarded, 'timer').mode, 'manual');
      });

      test('the chip has no words', () => {
        assert.equal(chipOf(discarded, 'timer').anchor, undefined);
      });

      test('no proposal is left', () => {
        assert.equal(proposals(discarded, ctx).length, 0);
      });

      test('the chip keeps its value', () => {
        assert.deepEqual(shown(discarded, ctx, 'timer'), { minutes: 30 });
      });
    });
  }
});

describe('recipe-step-chips › Following the text again', () => {
  const { ctx, step } = pinnedTimer();
  const changed = rewrite(step, ctx, '30', '45');
  const following = setMode(changed, step.chips[0].id, 'auto', ctx);

  test('the chip follows the text', () => {
    assert.equal(chipOf(following, 'timer').mode, 'auto');
  });

  test('the chip shows the value of the words', () => {
    assert.deepEqual(shown(following, ctx, 'timer'), { minutes: 45 });
  });

  test('later edits to the words update the chip', () => {
    assert.deepEqual(shown(rewrite(following, ctx, '45', '20'), ctx, 'timer'), { minutes: 20 });
  });

  // Words that say nothing cannot be followed.
  test('words that say nothing cannot be followed', () => {
    assert.equal(setMode(edit(step, ctx, 5, 10, ''), step.chips[0].id, 'auto', ctx).chips[0].mode, 'manual');
  });
});

describe('recipe-step-chips › Editing a value pins the chip', () => {
  const ctx = alone('250 g bloem');
  const step = typed('Zeef de bloem. Bak 30 minuten op 180 graden.', ctx);
  const timer = editValues(step, chipOf(step, 'timer').id, { minutes: 40 }, ctx);
  const oven = editValues(timer, chipOf(step, 'oven').id, { degrees: 200 }, ctx);
  const bloem = editValues(oven, chipOf(step, 'ingredient').id, { quantity: '1 kg' }, ctx);

  test('an edited timer is pinned', () => {
    assert.equal(chipOf(timer, 'timer').mode, 'manual');
  });

  test('an edited timer shows the new value', () => {
    assert.deepEqual(shown(timer, ctx, 'timer'), { minutes: 40 });
  });

  test('the words the value was changed against are not proposed back', () => {
    assert.equal(proposals(timer, ctx).length, 0, 'the words the value was changed against are not proposed back');
  });

  test('an edited oven shows the new value', () => {
    assert.deepEqual(shown(oven, ctx, 'oven'), { degrees: 200 });
  });

  test('an edited ingredient shows the new amount and keeps its name', () => {
    assert.deepEqual(shown(bloem, ctx, 'ingredient'), { quantity: '1 kg', name: 'bloem' });
  });

  test('an edited ingredient is pinned', () => {
    assert.equal(chipOf(bloem, 'ingredient').mode, 'manual');
  });

  // When the words change, the difference is proposed.
  test('when the words change, the difference is proposed', () => {
    assert.equal(proposals(rewrite(bloem, ctx, '30', '35'), ctx).length, 1);
  });
});

describe('recipe-step-chips › Hand-made chips cannot follow the text', () => {
  const ctx = alone();
  const step = addChip(typed('Roer goed.', ctx), 'timer', 'h0');
  const chip = chipOf(step, 'timer');

  test('the chip is pinned', () => {
    assert.equal(chip.mode, 'manual');
  });

  test('the chip has no words', () => {
    assert.equal(chip.anchor, undefined);
  });

  test('following the text changes nothing', () => {
    assert.equal(setMode(step, chip.id, 'auto', ctx), step);
  });
});

describe('timer names', () => {
  const ctx = alone();
  const step = typed('Laat 30 minuten rusten', ctx);
  const named = setLabel(step, step.chips[0].id, 'Deeg rust');

  test('a name does not pin the timer', () => {
    assert.equal(chipOf(named, 'timer').mode, 'auto');
  });

  test('the name is not read from the text', () => {
    assert.equal(chipOf(rewrite(named, ctx, '30', '45'), 'timer').label, 'Deeg rust');
  });

  test('an empty name clears the label', () => {
    assert.equal(chipOf(setLabel(named, step.chips[0].id, ''), 'timer').label, undefined);
  });
});

describe('recipe-step-chips › Full amount when several steps use the ingredient', () => {
  const ctx = alone('150 g boter');

  for (const body of ['Smelt de boter.', 'Voeg boter toe.']) {
    test(`"${body}" shows the full amount`, () => {
      assert.deepEqual(shown(typed(body, ctx), ctx, 'ingredient'), { quantity: '150 g', name: 'boter' });
    });
  }

  // A step that writes an amount does not take the full amount away from the one that doesn't.
  test('a step that writes an amount keeps that amount', () => {
    assert.deepEqual(shown(typed('Voeg 50 g boter toe.', ctx), ctx, 'ingredient'), { quantity: '50 g', name: 'boter' });
  });

  test('a step without an amount still shows the full amount', () => {
    assert.deepEqual(shown(typed('Smelt de boter.', ctx), ctx, 'ingredient'), { quantity: '150 g', name: 'boter' });
  });
});

// Ghosts

describe('recipe-step-chips › Removing an anchored chip leaves a ghost', () => {
  const ctx = alone();
  const step = typed('Laat 30 minuten rusten', ctx);
  const removed = removeChip(step, step.chips[0].id, ctx);

  test('the chip is gone', () => {
    assert.equal(removed.chips.length, 0);
  });

  test('the text stays', () => {
    assert.equal(removed.body, step.body);
  });

  test('one ghost is left', () => {
    assert.equal(removed.ghosts.length, 1);
  });

  test('the ghost has the kind of the chip', () => {
    assert.equal(removed.ghosts[0].kind, 'timer');
  });

  test('the ghost has the anchor of the chip', () => {
    assert.deepEqual(removed.ghosts[0].anchor, step.chips[0].anchor);
  });
});

describe('recipe-step-chips › Restoring a ghost', () => {
  const ctx = alone();
  const step = typed('Laat 30 minuten rusten', ctx);
  const restored = restoreGhost(removeChip(step, step.chips[0].id, ctx), step.chips[0].id, ctx);

  test('the ghost is gone', () => {
    assert.equal(restored.ghosts.length, 0);
  });

  test('the chip follows the text again', () => {
    assert.equal(chipOf(restored, 'timer').mode, 'auto');
  });

  test('the chip shows the value of the words', () => {
    assert.deepEqual(shown(restored, ctx, 'timer'), { minutes: 30 });
  });

  test('the chip has the original anchor', () => {
    assert.deepEqual(restored.chips[0].anchor, step.chips[0].anchor);
  });
});

describe('recipe-step-chips › A ghost is not recreated by the text', () => {
  const ctx = alone();
  const step = typed('Laat 30 minuten rusten', ctx);
  const removed = removeChip(step, step.chips[0].id, ctx);
  const later = edit(edit(removed, ctx, 0, 0, 'Eerst '), ctx, removed.body.length + 6, 0, ' goed');

  test('edits around the ghost create no chip', () => {
    assert.equal(later.chips.length, 0);
  });

  test('the ghost is kept', () => {
    assert.equal(later.ghosts.length, 1);
  });

  test('the ghost follows its words', () => {
    assert.equal(later.body.slice(later.ghosts[0].anchor.start, later.ghosts[0].anchor.end), '30 minuten');
  });

  // A removed ingredient chip is held the same way.
  test('a removed ingredient chip is held the same way', () => {
    const bloem = alone('250 g bloem');
    const zeef = typed('Zeef de bloem.', bloem);
    const gone = removeChip(zeef, zeef.chips[0].id, bloem);
    assert.equal(edit(gone, bloem, 0, 0, 'Dan: ').chips.length, 0);
  });
});

describe('recipe-step-chips › A ghost disappears with its words', () => {
  const ctx = alone();
  const step = typed('Laat 30 minuten rusten', ctx);
  const removed = removeChip(step, step.chips[0].id, ctx);

  test('deleting the words', () => {
    assert.equal(edit(removed, ctx, 5, 10, '').ghosts.length, 0);
  });

  test('words that stop saying a duration', () => {
    assert.equal(rewrite(removed, ctx, 'minuten', 'gram').ghosts.length, 0);
  });

  // After that the slot is free again.
  test('after that the slot is free again', () => {
    assert.equal(chipOf(rewrite(edit(removed, ctx, 5, 10, ''), ctx, 'rusten', 'rusten 10 minuten'), 'timer').mode, 'auto');
  });
});

describe('recipe-step-chips › Removing a hand-made chip leaves nothing', () => {
  const ctx = alone();
  const step = addChip(typed('Roer goed.', ctx), 'oven', 'h0');
  const removed = removeChip(step, step.chips[0].id, ctx);

  test('the chip is gone', () => {
    assert.equal(removed.chips.length, 0);
  });

  test('no ghost is left', () => {
    assert.equal(removed.ghosts.length, 0);
  });
});

describe('recipe-step-chips › A hand-made chip is pinned and has no words', () => {
  const ctx = alone();
  const step = addChip(typed('Roer goed.', ctx), 'timer', 'h0');
  const made = editValues(step, step.chips[0].id, { minutes: 15 }, ctx);

  test('the step has one chip', () => {
    assert.equal(made.chips.length, 1);
  });

  test('the chip is pinned', () => {
    assert.equal(chipOf(made, 'timer').mode, 'manual');
  });

  test('the chip has no words', () => {
    assert.equal(chipOf(made, 'timer').anchor, undefined);
  });

  test('the chip shows its value', () => {
    assert.deepEqual(shown(made, ctx, 'timer'), { minutes: 15 });
  });

  // It holds the slot, so words that look like a timer do not create another.
  test('it holds the slot, so words that look like a timer create no other', () => {
    assert.equal(edit(made, ctx, 0, 0, 'Wacht 10 minuten. ').chips.length, 1);
  });
});

describe('recipe-step-chips › One oven and one timer per step', () => {
  const ctx = alone();
  const step = typed('Bak 30 minuten op 180 graden.', ctx);

  test('no second oven', () => {
    assert.equal(canAdd(step, 'oven'), false);
  });

  test('no second timer', () => {
    assert.equal(canAdd(step, 'timer'), false);
  });

  test('more ingredients can be added', () => {
    assert.equal(canAdd(step, 'ingredient'), true);
  });

  test('adding a second timer changes nothing', () => {
    assert.equal(addChip(step, 'timer', 'h0'), step);
  });

  // A ghost counts as well.
  test('a ghost counts as well', () => {
    const ghost = removeChip(step, chipOf(step, 'timer').id, ctx);
    assert.equal(canAdd(ghost, 'timer'), false);
  });

  test('a step without a timer can add one', () => {
    assert.equal(canAdd(typed('Roer.', ctx), 'timer'), true);
  });
});

// Saving and restoring

describe('recipe-step-chips › A pinned chip is saved with its pinned values', () => {
  const ctx = alone('250 g bloem');
  const step = typed('Zeef de bloem. Bak 30 minuten op 180 graden.', ctx);
  const timer = setLabel(setMode(step, chipOf(step, 'timer').id, 'manual', ctx), chipOf(step, 'timer').id, 'Bakken');
  const changed = rewrite(timer, ctx, '30 minuten', '45 minuten');

  test('the changed words are proposed', () => {
    assert.equal(proposals(changed, ctx).length, 1);
  });

  test('the stored step has the new text and the pinned values', () => {
    assert.deepEqual(toStored(changed, ctx), {
      body: 'Zeef de bloem. Bak 45 minuten op 180 graden.',
      ingredients: [{ quantityText: '250 g', name: 'bloem' }],
      ovenTemperature: 180,
      timer: { minutes: 30, label: 'Bakken' },
    });
  });
});

describe("recipe-step-chips › The timer's name does not pin it", () => {
  const ctx = alone();
  const step = typed('Laat 30 minuten rusten', ctx);
  const named = setLabel(step, step.chips[0].id, 'Deeg rust');
  const stored = toStored(rewrite(named, ctx, '30', '45'), ctx);
  const again = classifyStored(stored, ctx);

  test('a named timer still follows the text', () => {
    assert.equal(chipOf(named, 'timer').mode, 'auto');
  });

  test('the stored timer has the new value and the name', () => {
    assert.deepEqual(stored.timer, { minutes: 45, label: 'Deeg rust' });
  });

  // Opened again: the name is kept and the chip still follows the text.
  test('opened again, the chip still follows the text', () => {
    assert.equal(chipOf(again, 'timer').mode, 'auto');
  });

  test('opened again, the name is kept', () => {
    assert.equal(chipOf(again, 'timer').label, 'Deeg rust');
  });
});

describe('toStored', () => {
  const ctx = alone();
  const empty = addChip(addChip(addChip(typed('Roer.', ctx), 'ingredient', 'h0'), 'oven', 'h1'), 'timer', 'h2');
  const invalid = editValues(editValues(empty, chipOf(empty, 'oven').id, { degrees: 0 }, ctx), chipOf(empty, 'timer').id, { minutes: 2.5 }, ctx);
  const stored = toStored(invalid, ctx);

  test('an ingredient chip without a name is not stored', () => {
    assert.deepEqual(toStored(empty, ctx).ingredients, [], 'an ingredient chip without a name is not stored');
  });

  test('an oven temperature of 0 is not stored', () => {
    assert.equal(stored.ovenTemperature, undefined);
  });

  test('a timer of a fraction of a minute is not stored', () => {
    assert.equal(stored.timer, undefined);
  });

  // The plausible range only drives recognition: a hand-made 40 degrees is kept.
  test('a hand-made oven temperature outside the plausible range is kept', () => {
    assert.equal(toStored(editValues(invalid, chipOf(invalid, 'oven').id, { degrees: 40 }, ctx), ctx).ovenTemperature, 40);
  });
});

describe('recipe-step-chips › A stored chip that matches its text follows it', () => {
  const ctx = alone('250 g bloem');
  const step = classifyStored(
    {
      body: 'Zeef de bloem. Bak 30 minuten op 180 graden.',
      ingredients: [{ quantityText: '250 g', name: 'bloem' }],
      ovenTemperature: 180,
      timer: { minutes: 30 },
    },
    ctx,
  );

  test('all chips follow the text', () => {
    assert.deepEqual(
      step.chips.map((c) => c.mode),
      ['auto', 'auto', 'auto'],
    );
  });

  test('the timer marks its words', () => {
    assert.equal(words(step, 'timer'), '30 minuten');
  });

  test('the oven marks its words', () => {
    assert.equal(words(step, 'oven'), '180 graden');
  });

  test('the ingredient marks its words', () => {
    assert.equal(words(step, 'ingredient'), 'bloem');
  });

  test('the ingredient is linked to its row', () => {
    assert.equal(chipOf(step, 'ingredient').rowId, 'r0');
  });

  test('no ghost is made', () => {
    assert.equal(step.ghosts.length, 0);
  });
});

describe('recipe-step-chips › A stored chip that differs is pinned', () => {
  const ctx = alone('250 g bloem');
  const step = classifyStored(
    {
      body: 'Zeef de bloem. Bak 30 minuten op 180 graden.',
      ingredients: [{ quantityText: '100 g', name: 'bloem' }],
      ovenTemperature: 200,
      timer: { minutes: 40 },
    },
    ctx,
  );

  test('all chips are pinned', () => {
    assert.deepEqual(
      step.chips.map((c) => c.mode),
      ['manual', 'manual', 'manual'],
    );
  });

  test('the timer shows the stored value', () => {
    assert.deepEqual(shown(step, ctx, 'timer'), { minutes: 40 });
  });

  test('the timer proposes the value of the words', () => {
    assert.deepEqual(proposal(chipOf(step, 'timer'), step.body, ctx), { type: 'change', values: { minutes: 30 } });
  });

  test('the oven proposes the value of the words', () => {
    assert.deepEqual(proposal(chipOf(step, 'oven'), step.body, ctx), { type: 'change', values: { degrees: 180 } });
  });

  test('the ingredient proposes the amount of the list', () => {
    assert.deepEqual(proposal(chipOf(step, 'ingredient'), step.body, ctx), { type: 'change', values: { quantity: '250 g', name: 'bloem' } });
  });

  test('there are three proposals', () => {
    assert.equal(proposals(step, ctx).length, 3);
  });
});

describe('recipe-step-chips › A stored chip without matching words is pinned without words', () => {
  const ctx = alone('250 g bloem');
  const step = classifyStored(
    {
      body: 'Verwarm de oven voor.',
      ingredients: [
        { quantityText: '1 scheutje', name: 'citroensap' },
        { quantityText: '250 g', name: 'bloem' },
      ],
      ovenTemperature: 180,
      timer: { minutes: 20, label: 'Wachten' },
    },
    ctx,
  );

  test('every stored chip is kept', () => {
    assert.equal(step.chips.length, 4);
  });

  test('every chip is pinned', () => {
    for (const chip of step.chips) assert.equal(chip.mode, 'manual');
  });

  test('no chip has words', () => {
    for (const chip of step.chips) assert.equal(chip.anchor, undefined);
  });

  test('an ingredient not in the list is linked to no row', () => {
    assert.equal(step.chips.find((c) => c.kind === 'ingredient' && c.values.name === 'citroensap')?.rowId, undefined);
  });

  test('an ingredient in the list is linked to its row all the same', () => {
    assert.equal(step.chips.find((c) => c.kind === 'ingredient' && c.values.name === 'bloem')?.rowId, 'r0', 'linked to the row all the same');
  });

  test('nothing is proposed', () => {
    assert.equal(proposals(step, ctx).length, 0);
  });
});

describe('recipe-step-chips › Words without a stored chip get a ghost', () => {
  const ctx = alone('250 g bloem');
  const step = classifyStored({ body: 'Zeef de bloem. Bak 30 minuten op 180 graden.', ingredients: [] }, ctx);

  test('no chip is made', () => {
    assert.equal(step.chips.length, 0);
  });

  test('a ghost is made for every kind of words', () => {
    assert.deepEqual(step.ghosts.map((g) => g.kind).sort(), ['ingredient', 'oven', 'timer']);
  });

  test('editing the text makes no chip', () => {
    assert.equal(edit(step, ctx, 0, 0, 'Dan ').chips.length, 0);
  });
});

describe('classifyStored', () => {
  describe('a stored ingredient is linked by name, by its last word, and to a row only once', () => {
    const ctx = alone('2 eieren', '1 kg zure appels', '100 g boter');
    const step = classifyStored(
      {
        body: 'Klop het ei. Schil een appel.',
        ingredients: [
          { quantityText: '1', name: 'ei' },
          { quantityText: '1', name: 'appel' },
          { quantityText: '2', name: 'eieren' },
          { quantityText: '', name: 'ZURE APPELS' },
        ],
      },
      ctx,
    );

    test('rows are linked in order and only once', () => {
      assert.deepEqual(
        step.chips.map((c) => c.rowId),
        ['r0', 'r1', undefined, undefined],
      );
    });

    test('a full name is linked ignoring case', () => {
      assert.equal(classifyStored({ body: 'x', ingredients: [{ quantityText: '', name: 'zure appels' }] }, ctx).chips[0].rowId, 'r1');
    });
  });
});

describe('recipe-step-chips › Usage line lists the steps', () => {
  test('the steps that use the ingredient', () => {
    const ctx = alone('1 tl zout', '1 ei');
    const bodies = ['Voeg zout toe.', 'Roer.', 'Bak.', 'Wacht.', 'Strooi zout.'];
    const steps = bodies.map((body) => typed(body, ctx));
    assert.deepEqual(usedIn(steps, 'r0'), [1, 5]);
  });
});

describe('recipe-step-chips › Unused ingredient has no usage line', () => {
  test('no step uses the ingredient', () => {
    const ctx = alone('1 tl zout', '1 ei');
    const bodies = ['Voeg zout toe.', 'Roer.'];
    const steps = bodies.map((body) => typed(body, ctx));
    assert.deepEqual(usedIn(steps, 'r1'), []);
  });
});
