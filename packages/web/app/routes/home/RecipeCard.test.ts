import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cssFor } from '~testing/css';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { RecipeCard } from './RecipeCard';

const recipe = { slug: 'soep', title: 'Soep', author: 'Oma', time: null, image: '/soep.jpg', seal: null };
const card = (r: Partial<typeof recipe & { isNew: boolean }> = {}) =>
  renderToStaticMarkup(createElement(MemoryRouter, null, createElement(RecipeCard, { recipe: { ...recipe, ...r }, tile: 0 })));

test('recipe-browsing › Card image ratio', async () => {
  const html = card();
  const classes = /<img[^>]*class="([^"]*)"/.exec(html)?.[1] ?? '';
  const css = await cssFor(classes);
  // 5:2 by default, 16:10 from 48rem, and height auto so the width/height attributes don't override the ratio.
  const flat = css.replace(/\s+/g, ' ');
  assert.match(flat, /aspect-ratio: 5\/2/);
  assert.match(flat, /@media \(width >= 48rem\) \{ [^{]*\{ aspect-ratio: 16\/10/);
  assert.match(flat, /height: auto/);
  // The tile band follows the image.
  assert.ok(html.indexOf('<svg') > html.indexOf('<img'));
});

// Needs a real browser at 390px width to measure what is visible without scrolling.
test.todo('recipe-browsing › Two recipes on one phone screen');

test('recipe-new-marker › Marker on a card with an image', async () => {
  const html = card({ isNew: true });
  const label = /<span class="([^"]*)">Nieuw<\/span>/.exec(html);
  assert.ok(label, 'label is shown');
  // Over the top-left of the image: before the image, positioned in the card's top-left corner.
  assert.ok(html.indexOf('>Nieuw<') < html.indexOf('<img'));
  const css = (await cssFor(label[1] ?? '')).replace(/\s+/g, ' ');
  assert.match(css, /position: absolute/);
  assert.match(css, /top: calc\(var\(--spacing\) \* 2\.5\)/);
  assert.match(css, /left: calc\(var\(--spacing\) \* 2\.5\)/);
  // Yellow with a dark border and the hard shadow.
  assert.match(css, /background-color: var\(--color-yel\)/);
  assert.match(css, /border-color: var\(--color-ink\)/);
  assert.match(css, /\.shadow-hard-sm \{ --tw-shadow: 3px 3px 0/);
  // It is text inside the card's link, so it is part of the accessible name.
  assert.match(html, /<a [^>]*>.*Nieuw.*Soep/);
  assert.doesNotMatch(card({ isNew: false }), /Nieuw/);
  assert.doesNotMatch(card(), /Nieuw/);
});
