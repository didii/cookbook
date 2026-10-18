import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import type { StoredRecipe } from '~/.server/recipes';
import type { Step } from '~/lib/recipes';
import { arrive, leave, tabForKey } from '~/lib/tabs';
import { IngredientList } from './IngredientList';
import { RecipePage } from './RecipePage';

const steps: Step[] = [
  { body: 'snijden', ingredients: [] },
  { body: 'bakken', ingredients: [], timer: { minutes: 50 } },
];

const recipe: Omit<StoredRecipe, 'steps'> = {
  id: 1,
  slug: 'appeltaart',
  title: 'Appeltaart',
  author: 'Oma',
  time: null,
  servings: null,
  intro: 'Zoet',
  image: null,
  seal: null,
  ingredients: [
    { quantity_text: '4', name: 'appels' },
    { quantity_text: '100 g', name: 'suiker' },
  ],
};

const page = () => renderToStaticMarkup(createElement(MemoryRouter, null, createElement(RecipePage, { recipe, tile: 0, steps })));

test('recipe-viewing › Tabs on a narrow screen', () => {
  const html = page();
  assert.equal(html.match(/role="tab"/g)?.length, 2);
  // The active tab is marked, the bar sticks to the top and is only there below 52rem.
  assert.ok(html.includes('id="tab-ingredients"') && /id="tab-ingredients"[^>]*aria-selected="true"/.test(html));
  assert.ok(/id="tab-steps"[^>]*aria-selected="false"/.test(html));
  assert.ok(/class="sticky[^"]*min-\[52rem\]:hidden"/.test(html));
  // One panel at a time below 52rem.
  assert.ok(
    /id="panel-steps"[^>]*class="[^"]*max-\[51\.99rem\]:hidden/.test(html) ||
      /class="[^"]*max-\[51\.99rem\]:hidden[^"]*"[^>]*id="panel-steps"/.test(html),
  );
});

// Needs layout: from 52rem both panels are shown side by side and the ingredient column is sticky.
test.todo('recipe-viewing › Two columns on a wide screen');

// Needs layout: the list scrolls by itself when the column is taller than the window.
test.todo('recipe-viewing › Long ingredient list on a wide screen');

// Needs layout: a tab is at least the screen height minus the measured sticky stack, so a short list sits at the top of its panel.
test.todo('recipe-viewing › Short tab content');

test('recipe-viewing › Ticked ingredients are kept', () => {
  // Both panels stay mounted, and the ticks live in the page and come down as props, so a tab switch loses nothing.
  const html = page();
  assert.ok(html.includes('id="panel-ingredients"') && html.includes('id="panel-steps"'));
  const list = renderToStaticMarkup(createElement(IngredientList, { ingredients: recipe.ingredients, ticked: new Set([1]), onToggle: () => {} }));
  assert.deepEqual(list.match(/checked=""/g)?.length, 1);
});

test('tabForKey', () => {
  assert.equal(tabForKey('ingredients', 'ArrowRight'), 'steps');
  assert.equal(tabForKey('steps', 'ArrowRight'), 'ingredients');
  assert.equal(tabForKey('ingredients', 'ArrowLeft'), 'steps');
  assert.equal(tabForKey('steps', 'Home'), 'ingredients');
  assert.equal(tabForKey('ingredients', 'End'), 'steps');
  assert.equal(tabForKey('ingredients', 'a'), undefined);
});

test('scroll positions per tab', () => {
  let positions = leave({}, 'steps', 1200);
  // Back on a tab that was left: where it was left. Never visited: heading just under the stack.
  assert.equal(arrive(positions, 'steps', 500, 60), 1200);
  assert.equal(arrive(positions, 'ingredients', 500, 60), 440);
  assert.equal(arrive(positions, 'ingredients', 20, 60), 0);
  positions = leave(positions, 'steps', 300);
  assert.equal(arrive(positions, 'steps', 500, 60), 300);
});

// Need a browser: the page scrolls back to where the tab was left, and an unvisited tab scrolls to its heading.
test.todo('recipe-viewing › Position is remembered');
test.todo('recipe-viewing › First visit of a tab');

test('cook-mode › Switch on a narrow screen', () => {
  const html = page();
  const at = html.indexOf('role="switch"');
  const stack = html.indexOf('class="sticky');
  // The switch is a real switch, directly above the sticky stack and not part of it.
  assert.ok(at > 0 && at < stack);
  assert.ok(/role="switch"[^>]*aria-checked="false"/.test(html));
  assert.ok(html.includes('Scherm mag slapen') && html.includes('Gaat vanzelf aan zodra je begint'));
});

test('cook-mode › No cook mode on a wide screen', () => {
  // The switch is hidden from 52rem on, and the decision never wants the lock there (see cookMode.test.ts).
  assert.ok(/<label class="[^"]*min-\[52rem\]:hidden[^"]*"><span[^>]*role="switch"/.test(page()));
});

test('cook-mode › Choice is not kept', () => {
  // The choice is plain component state, and the page is keyed by recipe so another recipe starts automatic again.
  const read = (file: string) => readFileSync(new URL(file, import.meta.url), 'utf8');
  assert.ok(read('./route.tsx').includes('key={recipe.slug}'));
  for (const file of ['./RecipePage.tsx', './CookSwitch.tsx', '../../lib/cookMode.ts'])
    assert.ok(!/localStorage|sessionStorage/.test(read(file)), file);
});
