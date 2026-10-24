import assert from 'node:assert/strict';
import { MemoryRouter } from 'react-router';
import { describe, test } from 'vitest';
import type { RecipeSummary } from '~app/shared/recipe';
import { cssFor, mediaFor } from '~testing/css';
import { precedes, render, screen } from '~testing/dom';
import { RecipeCard } from './RecipeCard';

const recipe: RecipeSummary = { slug: 'soep', title: 'Soep', author: 'Oma', time: null, image: '/soep.jpg', seal: null, categories: [], liked: false, hasNote: false };
const card = (r: Partial<RecipeSummary> = {}) =>
  render(
    <MemoryRouter>
      <RecipeCard recipe={{ ...recipe, ...r }} tile={0} />
    </MemoryRouter>,
  );

describe('recipe-browsing › Card image ratio', () => {
  // 5:2 by default, 16:10 from 48rem, and height auto so the width/height attributes don't override the ratio.
  const image = () => {
    card();
    return screen.getByTestId('RecipeCard-image');
  };
  const imageCss = async () => (await cssFor(image().className)).replace(/\s+/g, ' ');

  test('is 5:2 by default', async () => {
    assert.match(await imageCss(), /aspect-ratio: 5\/2/);
  });

  test('is 16:10 from 48rem', async () => {
    assert.match(await mediaFor(image().className, '(width >= 48rem)'), /aspect-ratio: 16\/10/);
  });

  test('has height auto', async () => {
    assert.match(await imageCss(), /height: auto/);
  });

  test('the tile band follows the image', () => {
    card();
    assert.ok(precedes(screen.getByTestId('RecipeCard-image'), screen.getByTestId('TileBand-band')));
  });
});

describe('RecipeCard without time', () => {
  test('shows the author', () => {
    card();
    assert.equal(screen.getByTestId('RecipeCard-author').textContent, 'van Oma');
  });

  test('has no time separator', () => {
    card();
    assert.ok(!screen.getByTestId('RecipeCard-link').textContent?.includes('·'));
  });
});

// Needs a real browser at 390px width to measure what is visible without scrolling.
test.todo('recipe-browsing › Two recipes on one phone screen');

describe('recipe-new-marker › Marker on a card with an image', () => {
  const labelCss = async () => {
    card({ isNew: true });
    return (await cssFor(screen.getByTestId('RecipeCard-new').className)).replace(/\s+/g, ' ');
  };

  // Over the top-left of the image: before the image, positioned in the card's top-left corner.
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

  // Yellow with a dark border and the hard shadow.
  test('is yellow with a dark border and the hard shadow', async () => {
    const css = await labelCss();
    assert.match(css, /background-color: var\(--color-yel\)/);
    assert.match(css, /border-color: var\(--color-ink\)/);
    assert.match(css, /--tw-shadow: 3px 3px 0/);
  });

  // It is text inside the card's link, so it is part of the accessible name.
  test('is part of the accessible name of the link', () => {
    card({ isNew: true });
    const link = screen.getByTestId('RecipeCard-link');
    assert.ok(link.contains(screen.getByTestId('RecipeCard-new')));
    const name = link.textContent ?? '';
    const marker = screen.getByTestId('RecipeCard-new').textContent!;
    assert.ok(name.includes(recipe.title) && name.indexOf(marker) < name.indexOf(recipe.title));
  });

  test('only a new card has the marker', () => {
    card({ isNew: true });
    card({ isNew: false });
    card();
    assert.equal(screen.getAllByTestId('RecipeCard-new').length, 1);
  });
});
