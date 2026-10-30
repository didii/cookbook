import assert from 'node:assert/strict';
import { describe, test, vi } from 'vitest';
import { defaultRules } from '~app/shared/rules';
import { fireEvent, render, screen } from '~testing/dom';
import { emptyDraftSeed, startingDraft, type RecipeDraft } from './draft';
import { RestoreDraftDialog } from './RestoreDraftDialog';

const lines = (...texts: string[]) => texts.map((text, i) => ({ id: `i${i}`, text }));
const steps = (...bodies: string[]) => bodies.map((body, i) => ({ id: `s${i}`, body, chips: [], ghosts: [] }));
const draftWith = (extra: Partial<RecipeDraft>): RecipeDraft => ({
  ...startingDraft(defaultRules, emptyDraftSeed),
  title: 'Soep',
  servings: '4',
  ...extra,
});
const full = draftWith({
  image: '/foto.jpg',
  source: 'https://example.com/soep',
  ingredients: lines('1 ui', '2 wortels', '3 prei', '4 aardappels', '5 selder'),
  steps: steps('Snijd', 'Kook', 'Pureer', 'Serveer'),
});
const show = (draft = full, handlers: { onUse?: () => void; onDiscard?: () => void } = {}) =>
  render(
    <RestoreDraftDialog
      draft={draft}
      savedAt="2026-01-01T10:00:00.000Z"
      onUse={handlers.onUse ?? vi.fn()}
      onDiscard={handlers.onDiscard ?? vi.fn()}
    />,
  );
const text = (id: string) => screen.getByTestId(id).textContent;

describe('recipe-draft › The popup shows the basics', () => {
  test('shows photo, name, servings and source', () => {
    show();
    assert.equal(screen.getByTestId('RestoreDraftDialog-photo').getAttribute('src'), '/foto.jpg');
    assert.equal(text('RestoreDraftDialog-title'), 'Soep');
    assert.equal(text('RestoreDraftDialog-servings'), '4');
    assert.equal(text('RestoreDraftDialog-source'), 'https://example.com/soep');
  });

  test('shows the first 3 ingredients', () => {
    show();
    assert.deepEqual(
      screen.getAllByTestId('RestoreDraftDialog-ingredient').map((li) => li.textContent),
      ['1 ui', '2 wortels', '3 prei'],
    );
  });

  test('shows the first 2 steps', () => {
    show();
    assert.deepEqual(
      screen.getAllByTestId('RestoreDraftDialog-step').map((li) => li.textContent),
      ['Snijd', 'Kook'],
    );
  });

  test('says how many ingredients and steps are left out', () => {
    show();
    assert.ok(text('RestoreDraftDialog-moreIngredients')?.includes('2'));
    assert.ok(text('RestoreDraftDialog-moreSteps')?.includes('2'));
  });

  test('skips blank ingredients and steps', () => {
    show(draftWith({ ingredients: lines('', '1 ui', '  '), steps: steps(' ') }));
    assert.equal(screen.getAllByTestId('RestoreDraftDialog-ingredient').length, 1);
    assert.equal(screen.queryByTestId('RestoreDraftDialog-step'), null);
    assert.equal(screen.queryByTestId('RestoreDraftDialog-moreIngredients'), null);
  });
});

describe('recipe-draft › A draft without a photo or source', () => {
  test('shows no photo', () => {
    show(draftWith({}));
    assert.equal(screen.queryByTestId('RestoreDraftDialog-photo'), null);
  });

  test('shows no source', () => {
    show(draftWith({}));
    assert.equal(screen.queryByTestId('RestoreDraftDialog-source'), null);
  });

  test('still shows the name', () => {
    show(draftWith({}));
    assert.equal(text('RestoreDraftDialog-title'), 'Soep');
  });
});

describe('recipe-draft › The popup cannot be dismissed without a choice', () => {
  test('is open when shown', () => {
    show();
    assert.equal(screen.getByTestId<HTMLDialogElement>('RestoreDraftDialog-dialog').open, true);
  });

  test('it opens again when the browser closes it anyway', () => {
    show();
    const dialog = screen.getByTestId<HTMLDialogElement>('RestoreDraftDialog-dialog');
    dialog.close();
    assert.equal(dialog.open, true);
  });

  test('the safe choice has the focus', () => {
    show();
    assert.equal(document.activeElement, screen.getByTestId('RestoreDraftDialog-use'));
  });

  test('Escape (cancel) is prevented', () => {
    show();
    const notPrevented = fireEvent(screen.getByTestId('RestoreDraftDialog-dialog'), new Event('cancel', { cancelable: true }));
    assert.equal(notPrevented, false);
  });
});

describe('recipe-draft › Clicking outside keeps the draft', () => {
  test('a click on the backdrop calls onUse', () => {
    const onUse = vi.fn();
    show(full, { onUse });
    fireEvent.click(screen.getByTestId('RestoreDraftDialog-dialog'));
    assert.equal(onUse.mock.calls.length, 1);
  });

  test('a click on the content does not', () => {
    const onUse = vi.fn();
    show(full, { onUse });
    fireEvent.click(screen.getByTestId('RestoreDraftDialog-heading'));
    assert.equal(onUse.mock.calls.length, 0);
  });
});

describe('RestoreDraftDialog buttons', () => {
  test('use calls onUse', () => {
    const onUse = vi.fn();
    show(full, { onUse });
    fireEvent.click(screen.getByTestId('RestoreDraftDialog-use'));
    assert.equal(onUse.mock.calls.length, 1);
  });

  test('discard calls onDiscard', () => {
    const onDiscard = vi.fn();
    show(full, { onDiscard });
    fireEvent.click(screen.getByTestId('RestoreDraftDialog-discard'));
    assert.equal(onDiscard.mock.calls.length, 1);
  });
});
