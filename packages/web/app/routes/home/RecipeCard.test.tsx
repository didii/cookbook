import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cssFor } from '~testing/css';
import { precedes, render, screen } from '~testing/dom';
import { MemoryRouter } from 'react-router';
import type { RecipeSummary } from '~/lib/recipe';
import { RecipeCard } from './RecipeCard';

const recipe: RecipeSummary = { slug: 'soep', title: 'Soep', author: 'Oma', time: null, image: '/soep.jpg', seal: null };
const card = (r: Partial<RecipeSummary> = {}) =>
  render(
    <MemoryRouter>
      <RecipeCard recipe={{ ...recipe, ...r }} tile={0} />
    </MemoryRouter>,
  );

test('recipe-browsing › Card image ratio', async () => {
  const { container } = card();
  const image = container.querySelector('img')!;
  const css = await cssFor(image.className);
  // 5:2 by default, 16:10 from 48rem, and height auto so the width/height attributes don't override the ratio.
  const flat = css.replace(/\s+/g, ' ');
  assert.match(flat, /aspect-ratio: 5\/2/);
  assert.match(flat, /@media \(width >= 48rem\) \{ [^{]*\{ aspect-ratio: 16\/10/);
  assert.match(flat, /height: auto/);
  // The tile band follows the image.
  assert.ok(precedes(image, container.querySelector('svg')!));
});

// Needs a real browser at 390px width to measure what is visible without scrolling.
test.todo('recipe-browsing › Two recipes on one phone screen');

test('recipe-new-marker › Marker on a card with an image', async () => {
  const { container } = card({ isNew: true });
  const label = screen.getByTestId('RecipeCard-new');
  // Over the top-left of the image: before the image, positioned in the card's top-left corner.
  assert.ok(precedes(label, container.querySelector('img')!));
  const css = (await cssFor(label.className)).replace(/\s+/g, ' ');
  assert.match(css, /position: absolute/);
  assert.match(css, /top: calc\(var\(--spacing\) \* 2\.5\)/);
  assert.match(css, /left: calc\(var\(--spacing\) \* 2\.5\)/);
  // Yellow with a dark border and the hard shadow.
  assert.match(css, /background-color: var\(--color-yel\)/);
  assert.match(css, /border-color: var\(--color-ink\)/);
  assert.match(css, /\.shadow-hard-sm \{ --tw-shadow: 3px 3px 0/);
  // It is text inside the card's link, so it is part of the accessible name.
  assert.ok(screen.getByTestId('RecipeCard-link').contains(label));
  card({ isNew: false });
  card();
  assert.equal(screen.getAllByTestId('RecipeCard-new').length, 1);
});
