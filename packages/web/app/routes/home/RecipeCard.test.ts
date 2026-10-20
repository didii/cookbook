import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cssFor } from '~testing/css';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { RecipeCard } from './RecipeCard';

const recipe = { slug: 'soep', title: 'Soep', author: 'Oma', time: null, image: '/soep.jpg', seal: null };
const card = () => renderToStaticMarkup(createElement(MemoryRouter, null, createElement(RecipeCard, { recipe, tile: 0 })));

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
