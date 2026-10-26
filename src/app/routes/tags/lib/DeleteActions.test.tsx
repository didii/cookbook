import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import type { ManagedTag } from '~app/shared/tags';
import { fireEvent, render, screen } from '~testing/dom';
import { DeleteActions } from './DeleteActions';
import { recipeCount } from './recipeCount';

const show = (tag: ManagedTag, pending = false) => {
  const calls = { cancelled: 0 };
  render(<DeleteActions tag={tag} onCancel={() => calls.cancelled++} pending={pending} />);
  return calls;
};
const notice = () => screen.getByTestId('DeleteActions-notice').textContent ?? '';

describe('tag-management › Confirmation names the recipes', () => {
  test('it says the tag is on 3 recipes', () => {
    show({ name: 'Soep', category: null, uses: 3 });
    assert.ok(notice().includes(recipeCount(3)));
  });

  test('it says the recipes stay', () => {
    show({ name: 'Soep', category: null, uses: 3 });
    assert.match(notice(), /blijven bestaan/);
  });

  test('it offers "Verwijder tag" and "Annuleer"', () => {
    show({ name: 'Soep', category: null, uses: 3 });
    assert.deepEqual(
      [screen.getByTestId('DeleteActions-confirm').textContent, screen.getByTestId('DeleteActions-cancel').textContent],
      ['Verwijder tag', 'Annuleer'],
    );
  });

  test('one recipe is singular', () => {
    show({ name: 'Soep', category: null, uses: 1 });
    assert.ok(notice().includes(recipeCount(1)));
  });
});

describe('tag-management › Confirmation for an unused tag', () => {
  test('it says the tag is on no recipe', () => {
    show({ name: 'Kerst', category: null, uses: 0 });
    assert.match(notice(), /geen enkel recept/);
  });
});

describe('DeleteActions', () => {
  test('"Verwijder tag" is the submit button of the form around it', () => {
    show({ name: 'Soep', category: null, uses: 3 });
    assert.equal(screen.getByTestId<HTMLButtonElement>('DeleteActions-confirm').type, 'submit');
  });

  test('"Annuleer" reports the cancel', () => {
    const calls = show({ name: 'Soep', category: null, uses: 3 });
    fireEvent.click(screen.getByTestId('DeleteActions-cancel'));
    assert.equal(calls.cancelled, 1);
  });

  test('a pending request disables "Verwijder tag"', () => {
    show({ name: 'Soep', category: null, uses: 3 }, true);
    assert.equal(screen.getByTestId<HTMLButtonElement>('DeleteActions-confirm').disabled, true);
  });
});
