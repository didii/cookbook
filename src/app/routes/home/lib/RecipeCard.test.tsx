import assert from 'node:assert/strict';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, test, vi } from 'vitest';
import type { LikeButton, Seal, TileBand } from '~app/shared/components';
import type { RecipeSummary } from '~app/shared/recipe';
import { cssFor } from '~testing/css';
import { precedes, render, screen, within } from '~testing/dom';
import { RecipeCard } from './RecipeCard';

/** The last props each shared child got, so the card's tests check what it passes and not the child's markup. */
const passed = vi.hoisted(() => new Map<string, unknown>());
vi.mock('~app/shared/components', async (importOriginal) => {
  const real = await importOriginal<typeof import('~app/shared/components')>();
  const record =
    <P extends object>(name: string, Child: (props: P) => ReactNode) =>
    (props: P) => {
      passed.set(name, props);
      return <Child {...props} />;
    };
  return { ...real, LikeButton: record('LikeButton', real.LikeButton), Seal: record('Seal', real.Seal), TileBand: record('TileBand', real.TileBand) };
});
afterEach(() => passed.clear());
const propsOf = <C extends (props: never) => ReactNode>(name: string) => passed.get(name) as Parameters<C>[0] | undefined;

const recipe: RecipeSummary = {
  slug: 'soep',
  title: 'Soep',
  author: 'Oma',
  time: null,
  image: '/soep.jpg',
  seal: null,
  tags: [],
  liked: false,
  hasNote: false,
};
const card = (r: Partial<RecipeSummary> = {}) =>
  render(
    <MemoryRouter>
      <RecipeCard recipe={{ ...recipe, ...r }} tile={0} />
    </MemoryRouter>,
  );
const pills = () => screen.queryAllByTestId('RecipeCard-tag').map((p) => p.textContent);
const firstBand = () => screen.getAllByTestId('TileBand-band')[0]!;

describe('recipe-browsing › Image, band, then text', () => {
  test('the tile band follows the image', () => {
    card();
    assert.ok(precedes(screen.getByTestId('RecipeCard-image'), firstBand()));
  });

  test('the title follows the tile band', () => {
    card();
    assert.ok(precedes(firstBand(), screen.getByTestId('RecipeCard-link')));
  });

  test('the author follows the title', () => {
    card();
    assert.ok(precedes(screen.getByTestId('RecipeCard-link'), screen.getByTestId('RecipeCard-author')));
  });

  test('the tags follow the author', () => {
    card({ tags: ['Soep'] });
    assert.ok(precedes(screen.getByTestId('RecipeCard-author'), screen.getByTestId('RecipeCard-tags')));
  });

  test('the band is one tile high', () => {
    card();
    assert.equal(propsOf<typeof TileBand>('TileBand')?.rows, 1);
  });
});

describe('recipe-browsing › Seal on the image', () => {
  test('the seal is shown with the image', () => {
    card({ seal: 'fu' });
    assert.ok(screen.getByTestId('Seal-image'));
  });

  test('the seal is the recipe’s own', () => {
    card({ seal: 'fu' });
    assert.equal(propsOf<typeof Seal>('Seal')?.sealId, 'fu');
  });
});

describe('recipe-browsing › Recipe without time or image', () => {
  test('the card shows no image', () => {
    card({ image: null });
    assert.equal(screen.queryByTestId('RecipeCard-image'), null);
  });

  test('the card shows no seal', () => {
    card({ image: null, seal: 'fu' });
    assert.equal(screen.queryByTestId('Seal-image'), null);
  });

  test('the tile band is three tiles high', () => {
    card({ image: null });
    assert.equal(propsOf<typeof TileBand>('TileBand')?.rows, 3);
  });

  test('the card shows the author without time', () => {
    card({ image: null });
    assert.equal(screen.getByTestId('RecipeCard-author').textContent, 'van Oma');
  });
});

// Needs real layout to measure heights.
test.todo('recipe-browsing › Card without image is as tall as with');
// Needs a real browser at 390px width.
test.todo('recipe-browsing › One card per row on a phone');
// Needs a real browser at 390px width to measure what is visible without scrolling.
test.todo('recipe-browsing › Two recipes on one phone screen');

describe('recipe-browsing › The whole card opens the recipe', () => {
  test('the title links to the recipe', () => {
    card();
    assert.equal(screen.getByTestId('RecipeCard-link').getAttribute('href'), '/recepten/soep');
  });

  test('the link stretches over the card', async () => {
    card();
    const css = (await cssFor(screen.getByTestId('RecipeCard-link').className)).replace(/\s+/g, ' ');
    assert.match(css, /position: absolute/);
    assert.match(css, /inset: 0px/);
  });
});

describe('recipe-browsing › Card reacts to the pointer', () => {
  test('the hover shadow is the larger one', async () => {
    card();
    const css = (await cssFor(screen.getByTestId('RecipeCard-card').className)).replace(/\s+/g, ' ');
    assert.match(css, /--tw-shadow: 7px 7px 0/);
  });
});

describe('recipe-browsing › Recipe with two tags', () => {
  test('both pills are shown in order', () => {
    card({ tags: ['Soep', 'Winter'] });
    assert.deepEqual(pills(), ['Soep', 'Winter']);
  });

  test('there is no "+" pill', () => {
    card({ tags: ['Soep', 'Winter'] });
    assert.equal(screen.queryByTestId('RecipeCard-more'), null);
  });
});

describe('recipe-browsing › Recipe with more tags', () => {
  test('the first two pills are shown', () => {
    card({ tags: ['Hoofdgerecht', 'Vlees', 'Winter'] });
    assert.deepEqual(pills(), ['Hoofdgerecht', 'Vlees']);
  });

  test('a pill says how many are left', () => {
    card({ tags: ['Hoofdgerecht', 'Vlees', 'Winter'] });
    assert.equal(screen.getByTestId('RecipeCard-more').textContent, '+1');
  });
});

describe('recipe-browsing › Recipe without tags', () => {
  test('no pills are shown', () => {
    card();
    assert.equal(screen.queryByTestId('RecipeCard-tags'), null);
  });
});

describe('recipe-browsing › Pills are not interactive', () => {
  test('no pill is a link', () => {
    card({ tags: ['A', 'B', 'C'] });
    assert.equal(within(screen.getByTestId('RecipeCard-tags')).queryAllByRole('link').length, 0);
  });

  test('no pill is a button', () => {
    card({ tags: ['A', 'B', 'C'] });
    assert.equal(within(screen.getByTestId('RecipeCard-tags')).queryAllByRole('button').length, 0);
  });
});

describe('recipe-like › Leaf is not inside the link', () => {
  test('the link does not contain the leaf', () => {
    card();
    assert.ok(!screen.getByTestId('RecipeCard-link').contains(screen.getByTestId('LikeButton-leaf')));
  });
});

describe('RecipeCard leaf', () => {
  test('is described by the title, so it says which recipe it is for', () => {
    card();
    assert.equal(propsOf<typeof LikeButton>('LikeButton')?.['aria-describedby'], screen.getByTestId('RecipeCard-link').id);
  });
});

describe('recipe-like › Card of a liked recipe', () => {
  test('the leaf is pressed', () => {
    card({ liked: true });
    assert.equal(screen.getByTestId('LikeButton-leaf').getAttribute('aria-pressed'), 'true');
  });
});

describe('recipe-like › Card of a recipe not liked', () => {
  test('the leaf is not pressed', () => {
    card();
    assert.equal(screen.getByTestId('LikeButton-leaf').getAttribute('aria-pressed'), 'false');
  });
});

describe('recipe-note › Card of a recipe with a note', () => {
  test('the note icon is named', () => {
    card({ hasNote: true });
    assert.equal(screen.getByTestId('RecipeCard-note').getAttribute('aria-label'), 'Je hebt een notitie');
  });
});

describe('recipe-note › Card of a recipe without a note', () => {
  test('no note icon is shown', () => {
    card();
    assert.equal(screen.queryByTestId('RecipeCard-note'), null);
  });
});

describe('recipe-note › Note icon only indicates', () => {
  test('the icon is an image', () => {
    card({ hasNote: true });
    assert.equal(screen.getByTestId('RecipeCard-note').getAttribute('role'), 'img');
  });

  test('the icon is not inside the link', () => {
    card({ hasNote: true });
    assert.ok(!screen.getByTestId('RecipeCard-link').contains(screen.getByTestId('RecipeCard-note')));
  });

  test('the icon is not inside the like button', () => {
    card({ hasNote: true });
    assert.ok(!screen.getByTestId('LikeButton-leaf').contains(screen.getByTestId('RecipeCard-note')));
  });
});

describe('recipe-new-marker › Marker on a card with an image', () => {
  const labelCss = async () => {
    card({ isNew: true });
    return (await cssFor(screen.getByTestId('RecipeCard-new').className)).replace(/\s+/g, ' ');
  };

  test('sits before the image', () => {
    card({ isNew: true });
    assert.ok(precedes(screen.getByTestId('RecipeCard-new'), screen.getByTestId('RecipeCard-image')));
  });

  test('is positioned in the top-left corner', async () => {
    const css = await labelCss();
    assert.match(css, /position: absolute/);
    assert.match(css, /top: calc\(var\(--spacing\) \* 2\.5\)/);
    assert.match(css, /left: calc\(var\(--spacing\) \* 2\.5\)/);
  });

  test('is yellow with a dark border and the hard shadow', async () => {
    const css = await labelCss();
    assert.match(css, /background-color: var\(--color-yel\)/);
    assert.match(css, /border-color: var\(--color-ink\)/);
    assert.match(css, /--tw-shadow: 3px 3px 0/);
  });

  test('is announced as the description of the link', () => {
    card({ isNew: true });
    assert.equal(screen.getByTestId('RecipeCard-link').getAttribute('aria-describedby'), screen.getByTestId('RecipeCard-new').id);
  });

  test('only a new card has the marker', () => {
    card({ isNew: true });
    card({ isNew: false });
    card();
    assert.equal(screen.getAllByTestId('RecipeCard-new').length, 1);
  });
});

describe('recipe-new-marker › Marker on a card without an image', () => {
  test('the label is over the top-left of the tile band', () => {
    card({ isNew: true, image: null });
    assert.ok(precedes(screen.getByTestId('RecipeCard-new'), firstBand()));
  });

  test('is announced as the description of the link', () => {
    card({ isNew: true, image: null });
    assert.equal(screen.getByTestId('RecipeCard-link').getAttribute('aria-describedby'), screen.getByTestId('RecipeCard-new').id);
  });
});

// Scenarios that add-recipe-tags removes: the main spec keeps them until the change is archived. Delete these then.
test.todo('recipe-browsing › Recipe with two categories');
test.todo('recipe-browsing › Recipe with more categories');
test.todo('recipe-browsing › Recipe without categories');
