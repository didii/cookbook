import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { afterEach, test } from 'node:test';
import { cleanup, fireEvent, precedes, render, screen, setViewport } from '~testing/dom';
import { routePaths } from '~testing/routes';
import { createElement, type ComponentProps } from 'react';
import { MemoryRouter } from 'react-router';
import type { Recipe, Step } from '~/lib/recipe';
import { arrive, type Positions, type TabId } from '~/lib/tabs';
import { IngredientList } from './IngredientList';
import { RecipePage } from './RecipePage';

const steps: Step[] = [
  { body: 'snijden', ingredients: [] },
  { body: 'bakken', ingredients: [], timer: { minutes: 50 } },
];

const recipe: Omit<Recipe, 'steps'> = {
  id: 1,
  slug: 'appeltaart',
  updated_at: '2026-01-01T00:00:00Z',
  title: 'Appeltaart',
  author: 'Oma',
  time: null,
  servings: null,
  intro: 'Zoet',
  image: null,
  seal: null,
  ingredients: [
    { quantityText: '4', name: 'appels' },
    { quantityText: '100 g', name: 'suiker' },
  ],
};

const page = (props: Partial<ComponentProps<typeof RecipePage>> = {}) =>
  render(createElement(MemoryRouter, null, createElement(RecipePage, { recipe, tile: 0, steps, ...props })));
/** The sticky bar with the tabs and the timer dock. */
const stack = () => screen.getByRole('tablist').parentElement!;

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

test('recipe-viewing › Tabs on a narrow screen', () => {
  page();
  assert.equal(screen.getAllByRole('tab').length, 2);
  // The active tab is marked, the bar sticks to the top and is only there below 52rem.
  assert.equal(screen.getByRole('tab', { name: 'Ingrediënten' }).getAttribute('aria-selected'), 'true');
  assert.equal(screen.getByRole('tab', { name: 'Bereiding' }).getAttribute('aria-selected'), 'false');
  assert.ok(stack().classList.contains('sticky') && stack().classList.contains('min-[52rem]:hidden'));
  // One panel at a time below 52rem.
  assert.ok(document.getElementById('panel-steps')!.classList.contains('max-[51.99rem]:hidden'));
  assert.ok(!document.getElementById('panel-ingredients')!.classList.contains('max-[51.99rem]:hidden'));
  // Choosing the other tab swaps which panel is hidden.
  fireEvent.click(screen.getByRole('tab', { name: 'Bereiding' }));
  assert.equal(screen.getByRole('tab', { name: 'Bereiding' }).getAttribute('aria-selected'), 'true');
  assert.ok(!document.getElementById('panel-steps')!.classList.contains('max-[51.99rem]:hidden'));
  assert.ok(document.getElementById('panel-ingredients')!.classList.contains('max-[51.99rem]:hidden'));
});

// Needs layout: from 52rem both panels are shown side by side and the ingredient column is sticky.
test.todo('recipe-viewing › Two columns on a wide screen');

// Needs layout: the list scrolls by itself when the column is taller than the window.
test.todo('recipe-viewing › Long ingredient list on a wide screen');

// Needs layout: a tab is at least the screen height minus the measured sticky stack, so a short list sits at the top of its panel.
test.todo('recipe-viewing › Short tab content');

test('recipe-viewing › Ticked ingredients are kept', () => {
  // Both panels stay mounted, and the ticks live in the page and come down as props, so a tab switch loses nothing.
  page();
  assert.ok(document.getElementById('panel-ingredients') && document.getElementById('panel-steps'));
  fireEvent.click(screen.getByRole('checkbox', { name: /appels/ }));
  fireEvent.click(screen.getByRole('tab', { name: 'Bereiding' }));
  fireEvent.click(screen.getByRole('tab', { name: 'Ingrediënten' }));
  assert.deepEqual(
    screen.getAllByRole<HTMLInputElement>('checkbox').map((c) => c.checked),
    [true, false],
  );
  cleanup();
  render(createElement(IngredientList, { ingredients: recipe.ingredients, ticked: new Set([1]), onToggle: () => {} }));
  assert.deepEqual(
    screen.getAllByRole<HTMLInputElement>('checkbox').map((c) => c.checked),
    [false, true],
  );
});

const heading = 500;
const stackHeight = 60;
const at = (positions: Positions, from: TabId, to: TabId) => arrive(positions, from, to, heading, stackHeight);

test('recipe-viewing › Position is remembered', () => {
  // Both tabs were scrolled into: each opens where it was left, in either direction.
  const positions = { steps: 1200, ingredients: 700 };
  assert.equal(at(positions, 'ingredients', 'steps'), 1200);
  assert.equal(at(positions, 'steps', 'ingredients'), 700);
  // Also when only the new tab has a position.
  assert.equal(at({ ingredients: 700 }, 'steps', 'ingredients'), 700);
});

test('recipe-viewing › First visit of a tab', () => {
  // Only the old tab was scrolled into: the heading just under the stack, and not above the top of the page.
  assert.equal(at({ steps: 1200 }, 'steps', 'ingredients'), 440);
  assert.equal(arrive({ steps: 1200 }, 'steps', 'ingredients', 20, stackHeight), 0);
});

test('recipe-viewing › Tabs swap in place', () => {
  assert.equal(at({}, 'steps', 'ingredients'), undefined);
  assert.equal(at({}, 'ingredients', 'steps'), undefined);
});

// Needs a browser: the position is kept by a scroll listener while the stack is stuck, and survives scrolling up out of that state.
test.todo('recipe-viewing › Position survives scrolling up');

test('recipe-viewing › Optional fields are empty', () => {
  // No time, no servings and no image: the page still renders, without them.
  const { container } = page();
  assert.ok(screen.getByRole('heading', { level: 1, name: 'Appeltaart' }));
  assert.ok(screen.getByText('van Oma'));
  assert.equal(screen.queryByText(/personen/), null);
  assert.equal(container.querySelector('img'), null);
  cleanup();
  // With them, each is shown.
  const full = page({ recipe: { ...recipe, time: '1 uur', servings: 6, image: '/taart.jpg' } });
  assert.ok(screen.getByText('1 uur'));
  assert.ok(screen.getByText('6 personen'));
  assert.ok(full.container.querySelector('img'));
});

test('recipe-viewing › Ingredient without quantity', () => {
  const ingredients = [
    { quantityText: '', name: 'zout' },
    { quantityText: '100 g', name: 'suiker' },
  ];
  page({ recipe: { ...recipe, ingredients } });
  const [salt, sugar] = screen.getAllByRole('checkbox').map((c) => c.closest('label')!);
  // Shown with its name only: the quantity cell is empty.
  assert.equal(salt.textContent, 'zout');
  assert.equal(sugar.textContent, '100 gsuiker');
});

test('recipe-viewing › Link to the edit form', () => {
  page();
  assert.equal(screen.getByRole('link', { name: 'Bewerk' }).getAttribute('href'), '/recepten/appeltaart/bewerken');
  // The route table serves that address.
  assert.ok(routePaths.includes('recepten/:slug/bewerken'));
});

test('cook-mode › Switch on a narrow screen', () => {
  page();
  const toggle = screen.getByRole('switch');
  // The switch is a real switch, directly above the sticky stack and not part of it.
  assert.ok(precedes(toggle, stack()) && !stack().contains(toggle));
  assert.equal(toggle.getAttribute('aria-checked'), 'false');
  assert.ok(screen.getByText('Scherm mag slapen') && screen.getByText('Gaat vanzelf aan zodra je begint'));
});

test('cook-mode › No cook mode on a wide screen', () => {
  // The switch is hidden from 52rem on, and the decision never wants the lock there (see cookMode.test.ts).
  page();
  assert.ok(screen.getByRole('switch').closest('label')!.classList.contains('min-[52rem]:hidden'));
});

test('cook-mode › Choice is not kept', () => {
  // On a phone cook mode starts by itself; turning it off by hand shows "Handmatig". A new page, as after a reload or another recipe, is automatic again.
  setViewport(390, 844);
  try {
    page();
    assert.equal(screen.getByRole('switch').getAttribute('aria-checked'), 'true');
    // Base UI's switch is a span; it changes through the hidden checkbox beside it.
    fireEvent.click(screen.getByRole('switch').closest('label')!.querySelector('input')!);
    assert.equal(screen.getByRole('switch').getAttribute('aria-checked'), 'false');
    assert.ok(screen.getByText('Handmatig'));
    cleanup();
    page();
    assert.equal(screen.getByRole('switch').getAttribute('aria-checked'), 'true');
    assert.equal(screen.queryByText('Handmatig'), null);
    // Nothing about the choice is stored (the timers keep their own state in sessionStorage).
    assert.equal(localStorage.length, 0);
    assert.deepEqual(
      Object.keys(sessionStorage).filter((k) => /cook/i.test(k)),
      [],
    );
  } finally {
    // Unmount first: a page still listening would react to the width changing back.
    cleanup();
    setViewport(1024);
  }
  // Another recipe gets a fresh page: the route keys the page by the recipe's slug.
  assert.ok(readFileSync(new URL('./route.tsx', import.meta.url), 'utf8').includes('key={recipe.slug}'));
});
