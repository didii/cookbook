import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { defaultRules } from '~app/shared/rules';
import {
  addStep,
  editedStep,
  editStep,
  emptyDraftSeed,
  isDirty,
  moveIngredient,
  moveStep,
  removeIngredient,
  removeStep,
  restoreStep,
  startingDraft,
  storedSteps,
  typeIngredient,
  type RecipeDraft,
} from './draft';
import type { Chip } from './steps/chips';
import { computeEdit } from './steps/textEdit';

const emptyDraft = startingDraft(defaultRules);
const content = { ...emptyDraftSeed, title: 'Soep', author: 'Oma' };
const stored = startingDraft(defaultRules, content);
const lines = (d: { ingredients: { text: string }[] }) => d.ingredients.map((r) => r.text);
const withLines = (...texts: string[]) => startingDraft(defaultRules, { ...content, ingredients: texts });

describe('isDirty', () => {
  test('equal drafts are not dirty', () => {
    assert.equal(isDirty(stored, { ...stored }, defaultRules), false);
  });

  test('a changed field is dirty', () => {
    assert.equal(isDirty(stored, { ...stored, time: '1 uur' }, defaultRules), true);
  });

  test('a whitespace-only difference is not dirty', () => {
    assert.equal(isDirty(stored, { ...stored, title: ' Soep ' }, defaultRules), false);
  });

  test('a changed intro is dirty', () => {
    assert.equal(isDirty(stored, { ...stored, intro: 'x' }, defaultRules), true);
  });

  test('reverting a change is not dirty again', () => {
    const changed = { ...stored, intro: 'x' };
    assert.equal(isDirty(stored, { ...changed, intro: '' }, defaultRules), false);
  });

  test('the empty row at the end is no change', () => {
    assert.equal(isDirty(withLines('a'), withLines('a'), defaultRules), false);
  });

  test('a blank typed row is no change', () => {
    assert.equal(isDirty(stored, typeIngredient(stored, stored.ingredients[0].id, '  ', defaultRules), defaultRules), false);
  });

  test('a typed row is a change', () => {
    assert.equal(isDirty(withLines('a'), withLines('a', 'b'), defaultRules), true);
  });

  test('a moved row is a change', () => {
    assert.equal(isDirty(withLines('a', 'b'), moveIngredient(withLines('a', 'b'), 'i1', 0, defaultRules), defaultRules), true);
  });
});

describe('startingDraft', () => {
  test('is the stored values', () => {
    assert.deepEqual(startingDraft(defaultRules, content), stored);
  });

  test('is empty without stored values', () => {
    assert.deepEqual(startingDraft(defaultRules), emptyDraft);
  });

  test('has one empty ingredient row', () => {
    assert.deepEqual(lines(stored), ['']);
  });
});

describe('recipe-ingredient-editing › Empty row at the end', () => {
  test('a new draft has one empty row', () => {
    assert.deepEqual(lines(emptyDraft), ['']);
  });

  test('filled rows are followed by an empty row', () => {
    assert.deepEqual(lines(withLines('bloem', 'zout')), ['bloem', 'zout', '']);
  });
});

describe('recipe-ingredient-editing › Typing adds the next row', () => {
  const draft = typeIngredient(emptyDraft, emptyDraft.ingredients[0].id, '1 ei', defaultRules);

  test('the typed row is followed by an empty row', () => {
    assert.deepEqual(lines(draft), ['1 ei', '']);
  });

  test('the rows have different ids', () => {
    assert.notEqual(draft.ingredients[0].id, draft.ingredients[1].id);
  });
});

describe('typeIngredient', () => {
  test('clearing the last filled row keeps that row and one empty row', () => {
    const draft = withLines('a', 'b');
    const cleared = typeIngredient(draft, draft.ingredients[1].id, '', defaultRules);
    assert.deepEqual(lines(cleared), ['a', '']);
    assert.equal(cleared.ingredients[1].id, draft.ingredients[1].id);
  });
});

describe('recipe-ingredient-editing › Row can be removed', () => {
  test('a middle row goes', () => {
    const draft = withLines('a', 'b', 'c');
    assert.deepEqual(lines(removeIngredient(draft, draft.ingredients[1].id, defaultRules)), ['a', 'c', '']);
  });

  test('the only empty row stays', () => {
    assert.deepEqual(lines(removeIngredient(emptyDraft, emptyDraft.ingredients[0].id, defaultRules)), ['']);
  });
});

describe('recipe-ingredient-editing › Row moves up and down', () => {
  const draft = withLines('a', 'b', 'c');
  const [a, , c] = draft.ingredients;
  const up = moveIngredient(draft, c.id, 1, defaultRules);

  test('a row moves up', () => {
    assert.deepEqual(lines(up), ['a', 'c', 'b', '']);
  });

  test('a row moves down', () => {
    assert.deepEqual(lines(moveIngredient(up, c.id, 2, defaultRules)), ['a', 'b', 'c', '']);
  });

  test('a position past the end moves to the end', () => {
    assert.deepEqual(lines(moveIngredient(draft, a.id, 5, defaultRules)), ['b', 'c', 'a', '']);
  });

  test('a negative position changes nothing', () => {
    assert.equal(moveIngredient(draft, a.id, -1, defaultRules), draft);
  });

  test('an unknown row changes nothing', () => {
    assert.equal(moveIngredient(draft, 'nope', 0, defaultRules), draft);
  });
});

const bodies = (d: { steps: { body: string }[] }) => d.steps.map((s) => s.body);
const withSteps = (...steps: string[]) => startingDraft(defaultRules, { ...content, steps: steps.map((body) => ({ body, ingredients: [] })) });

describe('recipe-step-editing › New recipe starts with one empty step', () => {
  test('the draft has one empty step', () => {
    assert.deepEqual(bodies(emptyDraft), ['']);
  });
});

describe('recipe-step-editing › Empty step at the end', () => {
  test('filled steps are followed by an empty step', () => {
    assert.deepEqual(bodies(withSteps('a', 'b')), ['a', 'b', '']);
  });
});

describe('recipe-step-editing › Typing adds the next step', () => {
  const draft = editStep(emptyDraft, 's0', 'x');

  test('the typed step is followed by an empty step', () => {
    assert.deepEqual(bodies(draft), ['x', '']);
  });

  test('typing in the empty step adds another', () => {
    assert.deepEqual(bodies(editStep(draft, 's1', 'y')), ['x', 'y', '']);
  });

  // Clearing a step leaves a single empty one at the end.
  test('clearing a step leaves a single empty one at the end', () => {
    assert.deepEqual(bodies(editStep(editStep(draft, 's1', 'y'), 's1', '')), ['x', '']);
  });
});

describe('recipe-step-editing › Insert above a step', () => {
  const draft = withSteps('a', 'b');

  test('an empty step is inserted at that position', () => {
    assert.deepEqual(bodies(addStep(draft, 1)), ['a', '', 'b', '']);
  });

  test('all step ids are unique', () => {
    assert.equal(new Set(addStep(draft, 1).steps.map((s) => s.id)).size, 4);
  });
});

describe('recipe-step-editing › Insert before the first step', () => {
  test('an empty step is inserted first', () => {
    assert.deepEqual(bodies(addStep(withSteps('a'), 0)), ['', 'a', '']);
  });
});

describe('recipe-step-editing › Step moves up and down', () => {
  const draft = withSteps('a', 'b', 'c');
  const up = moveStep(draft, 's2', 1);

  test('a step moves up', () => {
    assert.deepEqual(bodies(up), ['a', 'c', 'b', '']);
  });

  test('a step moves down', () => {
    assert.deepEqual(bodies(moveStep(up, 's2', 2)), ['a', 'b', 'c', '']);
  });

  test('a position past the end moves to the end', () => {
    assert.deepEqual(bodies(moveStep(draft, 's0', 9)), ['b', 'c', 'a', '']);
  });

  test('a negative position changes nothing', () => {
    assert.equal(moveStep(draft, 's0', -1), draft);
  });

  test('the empty step does not move', () => {
    assert.equal(moveStep(emptyDraft, 's0', 0), emptyDraft);
  });

  test('an unknown step changes nothing', () => {
    assert.equal(moveStep(draft, 'nope', 0), draft);
  });
});

describe('recipe-step-editing › Deleted step can be undone', () => {
  const draft = withSteps('a', 'b', 'c');
  const removed = draft.steps[1];
  const without = removeStep(draft, removed.id, defaultRules);
  // Meanwhile another step took the id of the removed one.
  const later = editStep(removeStep(draft, 's2', defaultRules), 's3', 'd');
  const restored = restoreStep(removeStep(later, 's1', defaultRules), removed, 1, defaultRules);
  // The only step with text leaves the empty step, which the restored step goes before.
  const only = withSteps('solo');
  const emptied = removeStep(only, 's0', defaultRules);

  test('deleting removes the step', () => {
    assert.deepEqual(bodies(without), ['a', 'c', '']);
  });

  test('a restored step goes back at its position', () => {
    assert.deepEqual(bodies(restored), ['a', 'b', 'd', '']);
  });

  test('a restored step gets a unique id', () => {
    assert.equal(new Set(restored.steps.map((s) => s.id)).size, 4);
  });

  test('restoring right away gives the original draft', () => {
    assert.deepEqual(restoreStep(without, removed, 1, defaultRules), draft);
  });

  test('the only step with text leaves the empty step', () => {
    assert.deepEqual(bodies(emptied), ['']);
  });

  test('restoring the only step goes before the empty step', () => {
    assert.deepEqual(restoreStep(emptied, only.steps[0], 0, defaultRules), only);
  });

  test('restoring the only step is not dirty', () => {
    assert.equal(isDirty(only, restoreStep(emptied, only.steps[0], 0, defaultRules), defaultRules), false);
  });
});

describe('recipe-step-editing › Deleting an empty step is immediate', () => {
  test('an empty step between others goes', () => {
    const draft = withSteps('a', '', 'c');
    assert.deepEqual(bodies(removeStep(draft, 's1', defaultRules)), ['a', 'c', '']);
  });

  test('the only empty step stays', () => {
    assert.deepEqual(bodies(removeStep(emptyDraft, 's0', defaultRules)), ['']);
  });
});

describe('recipe-step-editing › Deleting the last step with text leaves the empty step', () => {
  test('one empty step is left', () => {
    assert.deepEqual(bodies(removeStep(withSteps('solo'), 's0', defaultRules)), ['']);
  });
});

describe('isDirty with steps', () => {
  const draft = withSteps('a', 'b');

  test('an added empty step is no change', () => {
    assert.equal(isDirty(draft, addStep(draft), defaultRules), false);
  });

  test('whitespace around a step is no change', () => {
    assert.equal(isDirty(draft, editStep(draft, 's0', ' a '), defaultRules), false);
  });

  test('a typed step is a change', () => {
    assert.equal(isDirty(draft, editStep(draft, 's0', 'x'), defaultRules), true);
  });

  test('a moved step is a change', () => {
    assert.equal(isDirty(draft, moveStep(draft, 's0', 1), defaultRules), true);
  });

  test('a removed step is a change', () => {
    assert.equal(isDirty(draft, removeStep(draft, 's1', defaultRules), defaultRules), true);
  });

  test('an empty step on a stored recipe is no change', () => {
    assert.equal(isDirty(stored, addStep(stored), defaultRules), false);
  });
});

/** Types into a step the way the editor reports it: the text, then what was replaced. */
const typeStep = (draft: RecipeDraft, id: string, body: string) => {
  const before = draft.steps.find((s) => s.id === id)!.body;
  return editedStep(draft, id, body, computeEdit(before, body), defaultRules);
};

describe('recipe-step-chips › Chips travel with their step', () => {
  const draft = typeStep(withSteps('a', 'b'), 's1', 'Laat 30 minuten rusten');
  const timer = draft.steps[1].chips[0];
  const moved = moveStep(draft, 's1', 0);

  test('the step has a timer chip', () => {
    assert.equal(timer.kind, 'timer');
  });

  test('the step moves', () => {
    assert.deepEqual(bodies(moved), ['Laat 30 minuten rusten', 'a', '']);
  });

  test('the chips move along', () => {
    assert.deepEqual(moved.steps[0].chips, draft.steps[1].chips);
  });

  test('the ghosts move along', () => {
    assert.deepEqual(moved.steps[0].ghosts, draft.steps[1].ghosts);
  });

  test('the chip still points at its text', () => {
    assert.equal(moved.steps[0].body.slice(timer.anchor!.start, timer.anchor!.end), '30 minuten');
  });
});

describe('chips follow typing in a step and in the ingredient list', () => {
  const start = () => startingDraft(defaultRules, { ...content, ingredients: ['250 g bloem'], steps: [{ body: '', ingredients: [] }] });
  const typed = () => typeStep(start(), 's0', 'Zeef de bloem');
  const retyped = () => typeIngredient(typed(), 'i0', '300 g bloem', defaultRules);

  test('typing in a step adds an ingredient chip', () => {
    assert.deepEqual(storedSteps(typed(), defaultRules), [{ body: 'Zeef de bloem', ingredients: [{ quantityText: '250 g', name: 'bloem' }] }]);
  });

  test('typing in the ingredient list changes the chip', () => {
    assert.equal(storedSteps(retyped(), defaultRules)[0].ingredients[0].quantityText, '300 g');
  });

  test('removing the ingredient removes the chip', () => {
    assert.deepEqual(storedSteps(removeIngredient(retyped(), 'i0', defaultRules), defaultRules)[0].ingredients, []);
  });

  test('removing the ingredient keeps the step text', () => {
    assert.deepEqual(bodies(removeIngredient(retyped(), 'i0', defaultRules)), ['Zeef de bloem', '']);
  });
});

describe('stored chips', () => {
  const step = { body: 'Bak 30 minuten.', ingredients: [], timer: { minutes: 30, label: 'Bakken' } };
  const draft = startingDraft(defaultRules, { ...content, steps: [step] });

  test('come back as chips', () => {
    assert.deepEqual(storedSteps(draft, defaultRules), [step]);
  });

  test('unchanged chips are no change', () => {
    assert.equal(isDirty(draft, startingDraft(defaultRules, { ...content, steps: [step] }), defaultRules), false);
  });

  test('a pinned chip value is a change', () => {
    const pinned: RecipeDraft = {
      ...draft,
      steps: [{ ...draft.steps[0], chips: draft.steps[0].chips.map((c) => ({ ...c, mode: 'manual', values: { minutes: 40 } }) as Chip) }],
    };
    assert.equal(isDirty(draft, pinned, defaultRules), true);
  });

  test('removed chips are a change', () => {
    assert.equal(isDirty(draft, { ...draft, steps: [{ ...draft.steps[0], chips: [], ghosts: [] }] }, defaultRules), true);
  });
});

describe('an open proposed removal', () => {
  test('survives typing in another step', () => {
    const step = (body: string, ingredients = [{ quantityText: '250 g', name: 'bloem' }]) => ({ body, ingredients });
    let draft = startingDraft(defaultRules, { ...content, ingredients: ['250 g bloem'], steps: [step('Zeef de bloem'), step('a', [])] });
    const id = draft.steps[0].chips[0].id;
    draft = { ...draft, steps: [{ ...draft.steps[0], chips: [{ ...draft.steps[0].chips[0], mode: 'manual' }] }, draft.steps[1]] };
    draft = typeStep(draft, 's0', 'Zeef de pasta');
    draft = typeStep(draft, 's1', 'ab');
    const chip = draft.steps[0].chips.find((c) => c.id === id)!;
    assert.equal(chip.rowId, 'i0');
    assert.notEqual(chip.anchor, undefined);
  });
});
