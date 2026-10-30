import assert from 'node:assert/strict';
import { MemoryRouter, useLocation } from 'react-router';
import { describe, test, vi } from 'vitest';
import type { RecipeSummary } from '~app/shared/recipe';
import { fireEvent, render, screen, within } from '~testing/dom';
import { FridgeCard } from './FridgeCard';

const recipe: RecipeSummary = {
  slug: 'pap',
  title: 'Rijstepap',
  author: 'Oma',
  time: null,
  image: null,
  seal: null,
  tags: [],
  liked: false,
  hasNote: false,
};
const Path = () => <p data-testid="Test-path">{useLocation().pathname}</p>;
const show = (props: Partial<Parameters<typeof FridgeCard>[0]> = {}) => {
  const onHave = vi.fn();
  const onSkip = vi.fn();
  render(
    <MemoryRouter initialEntries={['/koelkast']}>
      <Path />
      <FridgeCard
        recipe={recipe}
        tile={0}
        total={4}
        used={['melk', 'ei', 'bloem']}
        unused={['rijst']}
        missing={['kaneel']}
        onHave={onHave}
        onSkip={onSkip}
        {...props}
      />
    </MemoryRouter>,
  );
  return { onHave, onSkip };
};
/** The part that opens the recipe, and the part below the separator. */
const linkArea = () => screen.getByTestId('RecipeCard-link').parentElement!;
const plainPart = () => screen.getByTestId('RecipeCard-extra');

describe('fridge-search › Count of used entries', () => {
  test('the card says how many of the Heb ik entries are used', () => {
    show();
    assert.equal(screen.getByTestId('FridgeCard-count').textContent, '3/4 in huis');
  });

  test('the count is in the part that opens the recipe', () => {
    show();
    assert.ok(linkArea().contains(screen.getByTestId('FridgeCard-count')));
  });
});

describe('fridge-search › No Heb ik entries', () => {
  test('the card shows no count', () => {
    show({ total: 0, used: [], unused: [], missing: ['kaneel'] });
    assert.equal(screen.queryByTestId('FridgeCard-count'), null);
  });

  test('the card shows no plain part', () => {
    show({ total: 0, used: [], unused: [], missing: ['kaneel'] });
    assert.equal(screen.queryByTestId('RecipeCard-extra'), null);
  });
});

describe('fridge-search › Plain part is separate', () => {
  test('the missing and unused ingredients are in the plain part', () => {
    show();
    assert.ok(within(plainPart()).getByTestId('MissingIngredients-section'));
    assert.ok(within(plainPart()).getByTestId('UnusedEntries-section'));
  });

  test('nothing in it is part of the link area', () => {
    show();
    assert.ok(!linkArea().contains(plainPart()));
  });

  test('the card has no plain part when nothing is missing or unused', () => {
    show({ used: ['a', 'b', 'c', 'd'], unused: [], missing: [] });
    assert.equal(screen.queryByTestId('RecipeCard-extra'), null);
  });
});

describe('fridge-search › Buttons do not open the recipe', () => {
  test('the + is outside the link', () => {
    show();
    assert.ok(!screen.getByTestId('RecipeCard-link').contains(screen.getByTestId('MissingIngredients-have')));
  });

  test('a press on it stays on the page', () => {
    show();
    fireEvent.click(screen.getByTestId('MissingIngredients-have'));
    assert.equal(screen.getByTestId('Test-path').textContent, '/koelkast');
  });
});

describe('fridge-search › Adding a missing ingredient to Heb ik', () => {
  test('pressing + calls onHave with the name', () => {
    const { onHave } = show();
    fireEvent.click(screen.getByTestId('MissingIngredients-have'));
    assert.deepEqual(onHave.mock.calls, [['kaneel']]);
  });
});

describe('fridge-search › Excluding a missing ingredient', () => {
  test('pressing − calls onSkip with the name', () => {
    const { onSkip } = show();
    fireEvent.click(screen.getByTestId('MissingIngredients-skip'));
    assert.deepEqual(onSkip.mock.calls, [['kaneel']]);
  });
});

describe('fridge-search › The card opens the recipe', () => {
  test('the title links to the recipe', () => {
    show();
    assert.equal(screen.getByTestId('RecipeCard-link').getAttribute('href'), '/recepten/pap');
  });
});
