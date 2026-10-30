import assert from 'node:assert/strict';
import type { ComponentProps } from 'react';
import { describe, test, vi } from 'vitest';
import type { RecipeSummary } from '~app/shared/recipe';
import { fireEvent, render, screen, within } from '~testing/dom';
import { FridgeCard } from './FridgeCard';

/** The shared card stands in as a shell that shows what FridgeCard hands it: the recipe, the footer and the children. */
const passed = vi.hoisted(() => ({ recipe: undefined as RecipeSummary | undefined }));
vi.mock('~app/shared/components', async (importOriginal) => {
  const real = await importOriginal<typeof import('~app/shared/components')>();
  return {
    ...real,
    RecipeCard: ({ recipe, footer, children }: ComponentProps<typeof real.RecipeCard>) => {
      passed.recipe = recipe;
      return (
        <div>
          <div data-testid="Test-footer">{footer}</div>
          {children && <div data-testid="Test-children">{children}</div>}
        </div>
      );
    },
  };
});

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
const show = (props: Partial<ComponentProps<typeof FridgeCard>> = {}) => {
  const onHave = vi.fn();
  const onSkip = vi.fn();
  render(
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
    />,
  );
  return { onHave, onSkip };
};
const footer = () => screen.getByTestId('Test-footer');
const children = () => screen.getByTestId('Test-children');

describe('fridge-search › The card opens the recipe', () => {
  test('the shared card gets the recipe', () => {
    show();
    assert.equal(passed.recipe, recipe);
  });
});

describe('fridge-search › Count of used entries', () => {
  test('the footer has the count of used entries and the number of entries', () => {
    show();
    assert.ok(within(footer()).getByTestId('FridgeCard-count').textContent?.startsWith('3/4'));
  });

  test('the count is not in the plain part', () => {
    show();
    assert.equal(within(children()).queryByTestId('FridgeCard-count'), null);
  });
});

describe('fridge-search › No Heb ik entries', () => {
  test('the card shows no count', () => {
    show({ total: 0, used: [], unused: [], missing: ['kaneel'] });
    assert.equal(screen.queryByTestId('FridgeCard-count'), null);
  });

  test('the card shows no plain part', () => {
    show({ total: 0, used: [], unused: [], missing: ['kaneel'] });
    assert.equal(screen.queryByTestId('Test-children'), null);
  });
});

describe('fridge-search › Plain part is separate', () => {
  test('the missing and unused ingredients are the children', () => {
    show();
    assert.ok(within(children()).getByTestId('MissingIngredients-section'));
    assert.ok(within(children()).getByTestId('UnusedEntries-section'));
  });

  test('none of them is in the footer', () => {
    show();
    assert.equal(within(footer()).queryByTestId('MissingIngredients-section'), null);
    assert.equal(within(footer()).queryByTestId('UnusedEntries-section'), null);
  });

  test('the card has no plain part when nothing is missing or unused', () => {
    show({ used: ['a', 'b', 'c', 'd'], unused: [], missing: [] });
    assert.equal(screen.queryByTestId('Test-children'), null);
  });
});

// The stretched link and the plain part above it belong to the shared card; a click in happy-dom does not follow an overlay link, so a test here could not fail.
test.todo('fridge-search › Buttons do not open the recipe');

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
