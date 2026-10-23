import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { ComponentProps } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, test } from 'vitest';
import type { Recipe, Step } from '~app/shared/recipe';
import { defaultRules } from '~app/shared/rules';
import { cleanup, fireEvent, precedes, render, screen, setViewport } from '~testing/dom';
import { routePaths } from '~testing/routes';
import { IngredientList } from './IngredientList';
import { RecipeView } from './RecipeView';
import { arrive, type Positions, type TabId } from './tabs';

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

const page = (props: Partial<ComponentProps<typeof RecipeView>> = {}) =>
  // A data router, because the page holds a router `Form` (delete button).
  render(
    <RouterProvider
      router={createMemoryRouter([{ path: '/', element: <RecipeView recipe={recipe} tile={0} steps={steps} rules={defaultRules} {...props} /> }])}
    />,
  );
/** The sticky bar with the tabs and the timer dock. */
const stack = () => screen.getByTestId('RecipeView-stack');
const tabs = () => screen.getAllByTestId('TabBar-tab');
const checkboxes = () => screen.getAllByTestId<HTMLInputElement>('IngredientList-checkbox');

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('recipe-viewing › Tabs on a narrow screen', () => {
  test('there are two tabs with tab roles in a tablist', () => {
    page();
    assert.equal(tabs().length, 2);
    assert.ok(tabs().every((t) => t.getAttribute('role') === 'tab') && screen.getByTestId('TabBar-list').getAttribute('role') === 'tablist');
  });

  test('the active tab is marked', () => {
    page();
    assert.equal(tabs()[0].getAttribute('aria-selected'), 'true');
    assert.equal(tabs()[1].getAttribute('aria-selected'), 'false');
  });

  test('the bar sticks to the top and is only there below 52rem', () => {
    page();
    assert.ok(stack().classList.contains('sticky') && stack().classList.contains('min-[52rem]:hidden'));
  });

  test('one panel at a time is shown below 52rem', () => {
    page();
    assert.ok(document.getElementById('panel-steps')!.classList.contains('max-[51.99rem]:hidden'));
    assert.ok(!document.getElementById('panel-ingredients')!.classList.contains('max-[51.99rem]:hidden'));
  });

  test('choosing the other tab swaps which panel is hidden', () => {
    page();
    fireEvent.click(tabs()[1]);
    assert.equal(tabs()[1].getAttribute('aria-selected'), 'true');
    assert.ok(!document.getElementById('panel-steps')!.classList.contains('max-[51.99rem]:hidden'));
    assert.ok(document.getElementById('panel-ingredients')!.classList.contains('max-[51.99rem]:hidden'));
  });
});

// Needs layout: from 52rem both panels are shown side by side and the ingredients scroll away with the page.
test.todo('recipe-viewing › Two columns on a wide screen');

// The page scrolling as a whole needs layout; checked here: the column has no sticky or scrolling behaviour of its own.
describe('recipe-viewing › Long ingredient list on a wide screen', () => {
  test('the column and its lists have no sticky or scrolling behaviour', () => {
    page();
    const column = document.getElementById('panel-ingredients')!;
    for (const el of [column, ...column.querySelectorAll('ul')]) {
      assert.doesNotMatch(el.className, /sticky|overflow|max-h/);
    }
  });
});

describe('RecipeView note', () => {
  beforeEach(() => {
    page({ liked: true, note: 'minder zout' });
  });

  test('the heart comes before "Bewerk" and is pressed', () => {
    assert.ok(precedes(screen.getByTestId('LikeButton-heart'), screen.getByTestId('RecipeView-edit')));
    assert.equal(screen.getByTestId('LikeButton-heart').getAttribute('aria-pressed'), 'true');
  });

  test('the note panel sits under the ingredients', () => {
    const column = document.getElementById('panel-ingredients')!;
    assert.ok(column.contains(screen.getByTestId('NotePanel-panel')));
    assert.ok(precedes(column.querySelector('ul')!, screen.getByTestId('NotePanel-panel')));
  });

  test('the note panel shows the note', () => {
    assert.equal(screen.getByTestId<HTMLTextAreaElement>('NotePanel-field').value, 'minder zout');
  });

  test('the note sheet button is marked', () => {
    assert.ok(screen.getByTestId('NoteSheet-marker'));
  });
});

// Needs layout: a tab is at least the screen height minus the measured sticky stack, so a short list sits at the top of its panel.
test.todo('recipe-viewing › Short tab content');

describe('recipe-viewing › Ticked ingredients are kept', () => {
  test('both panels stay mounted', () => {
    page();
    assert.ok(document.getElementById('panel-ingredients') && document.getElementById('panel-steps'));
  });

  test('a tick survives switching tabs back and forth', () => {
    // The ticks live in the page and come down as props, so a tab switch loses nothing.
    page();
    fireEvent.click(checkboxes()[0]);
    fireEvent.click(tabs()[1]);
    fireEvent.click(tabs()[0]);
    assert.deepEqual(
      checkboxes().map((c) => c.checked),
      [true, false],
    );
  });

  test('the list shows the ticks it gets as props', () => {
    render(<IngredientList ingredients={recipe.ingredients} ticked={new Set([1])} onToggle={() => {}} />);
    assert.deepEqual(
      checkboxes().map((c) => c.checked),
      [false, true],
    );
  });
});

const heading = 500;
const stackHeight = 60;
const at = (positions: Positions, from: TabId, to: TabId) => arrive(positions, from, to, heading, stackHeight);

describe('recipe-viewing › Position is remembered', () => {
  // Both tabs were scrolled into: each opens where it was left, in either direction.
  const positions = { steps: 1200, ingredients: 700 };

  test('steps open where they were left', () => {
    assert.equal(at(positions, 'ingredients', 'steps'), 1200);
  });

  test('ingredients open where they were left', () => {
    assert.equal(at(positions, 'steps', 'ingredients'), 700);
  });

  test('the new tab keeps its position when only it has one', () => {
    assert.equal(at({ ingredients: 700 }, 'steps', 'ingredients'), 700);
  });
});

describe('recipe-viewing › First visit of a tab', () => {
  // Only the old tab was scrolled into: the heading just under the stack, and not above the top of the page.
  test('the heading ends up just under the stack', () => {
    assert.equal(at({ steps: 1200 }, 'steps', 'ingredients'), 440);
  });

  test('the position is never above the top of the page', () => {
    assert.equal(arrive({ steps: 1200 }, 'steps', 'ingredients', 20, stackHeight), 0);
  });
});

describe('recipe-viewing › Tabs swap in place', () => {
  test('steps to ingredients has no position', () => {
    assert.equal(at({}, 'steps', 'ingredients'), undefined);
  });

  test('ingredients to steps has no position', () => {
    assert.equal(at({}, 'ingredients', 'steps'), undefined);
  });
});

// Needs a browser: the position is kept by a scroll listener while the stack is stuck, and survives scrolling up out of that state.
test.todo('recipe-viewing › Position survives scrolling up');

describe('recipe-viewing › Optional fields are empty', () => {
  // No time, no servings and no image: the page still renders, without them.
  test('the title and author still show', () => {
    page();
    assert.equal(screen.getByTestId('RecipeView-title').tagName, 'H1');
    assert.equal(screen.getByTestId('RecipeView-title').textContent, 'Appeltaart');
    assert.equal(screen.getByTestId('RecipeView-author').textContent, 'van Oma');
  });

  test('no time, servings or image show', () => {
    const { container } = page();
    assert.equal(screen.queryByTestId('RecipeView-time'), null);
    assert.equal(screen.queryByTestId('RecipeView-servings'), null);
    assert.equal(container.querySelector('img'), null);
  });

  test('with them, the time and servings are shown', () => {
    page({ recipe: { ...recipe, time: '1 uur', servings: 6, image: '/taart.jpg' } });
    assert.equal(screen.getByTestId('RecipeView-time').textContent, '1 uur');
    assert.equal(screen.getByTestId('RecipeView-servings').textContent, '6 personen');
    assert.equal((screen.getByTestId('ScaleControl-field') as HTMLInputElement).value, '6');
  });

  test('with them, the image is shown', () => {
    const full = page({ recipe: { ...recipe, time: '1 uur', servings: 6, image: '/taart.jpg' } });
    assert.ok(full.container.querySelector('img'));
  });
});

describe('recipe-viewing › Ingredient without quantity', () => {
  const ingredients = [
    { quantityText: '', name: 'zout' },
    { quantityText: '100 g', name: 'suiker' },
  ];

  test('is shown with its name only: the quantity cell is empty', () => {
    page({ recipe: { ...recipe, ingredients } });
    const [salt, sugar] = screen.getAllByTestId('IngredientList-row');
    assert.equal(salt.textContent, 'zout');
    assert.equal(sugar.textContent, '100 gsuiker');
  });
});

describe('recipe-viewing › Link to the edit form', () => {
  test('the edit button points at the edit address', () => {
    page();
    assert.equal(screen.getByTestId('RecipeView-edit').getAttribute('href'), '/recepten/appeltaart/bewerken');
  });

  test('the route table serves that address', () => {
    assert.ok(routePaths.includes('recepten/:slug/bewerken'));
  });
});

describe('cook-mode › Switch on a narrow screen', () => {
  beforeEach(() => {
    page();
  });

  test('the switch has the switch role', () => {
    assert.equal(screen.getByTestId('CookSwitch-switch').getAttribute('role'), 'switch');
  });

  test('the switch sits directly above the sticky stack and is not part of it', () => {
    const toggle = screen.getByTestId('CookSwitch-switch');
    assert.ok(precedes(toggle, stack()) && !stack().contains(toggle));
  });

  test('the switch is off at first', () => {
    assert.equal(screen.getByTestId('CookSwitch-switch').getAttribute('aria-checked'), 'false');
  });

  test('the texts explain it', () => {
    assert.ok(screen.getByTestId('CookSwitch-text').textContent?.startsWith('Scherm mag slapen'));
    assert.equal(screen.getByTestId('CookSwitch-sub').textContent, 'Gaat vanzelf aan zodra je begint');
  });
});

describe('cook-mode › No cook mode on a wide screen', () => {
  // The switch is hidden from 52rem on, and the decision never wants the lock there (see cookMode.test.ts).
  test('the switch is hidden from 52rem', () => {
    page();
    assert.ok(screen.getByTestId('CookSwitch-label').classList.contains('min-[52rem]:hidden'));
  });
});

describe('cook-mode › Choice is not kept', () => {
  // On a phone cook mode starts by itself; turning it off by hand shows "Handmatig". A new page, as after a reload or another recipe, is automatic again.
  beforeEach(() => setViewport(390, 844));
  afterEach(() => {
    // Unmount first: a page still listening would react to the width changing back.
    cleanup();
    setViewport(1024);
  });
  // Base UI's switch is a span; it changes through the hidden checkbox beside it.
  const turnOff = () => fireEvent.click(screen.getByTestId('CookSwitch-label').querySelector('input')!);

  test('cook mode starts by itself on a phone', () => {
    page();
    assert.equal(screen.getByTestId('CookSwitch-switch').getAttribute('aria-checked'), 'true');
  });

  test('turning it off by hand shows "Handmatig"', () => {
    page();
    turnOff();
    assert.equal(screen.getByTestId('CookSwitch-switch').getAttribute('aria-checked'), 'false');
    assert.equal(screen.getByTestId('CookSwitch-sub').textContent, 'Handmatig');
  });

  test('a new page is automatic again', () => {
    page();
    turnOff();
    cleanup();
    page();
    assert.equal(screen.getByTestId('CookSwitch-switch').getAttribute('aria-checked'), 'true');
    assert.notEqual(screen.getByTestId('CookSwitch-sub').textContent, 'Handmatig');
  });

  test('nothing about the choice is stored (the timers keep their own state in sessionStorage)', () => {
    page();
    turnOff();
    cleanup();
    page();
    assert.equal(localStorage.length, 0);
    assert.deepEqual(
      Object.keys(sessionStorage).filter((k) => /cook/i.test(k)),
      [],
    );
  });

  test('another recipe gets a fresh page: the route keys the page by the recipe slug', () => {
    assert.ok(readFileSync(new URL('../RecipePageRoute.tsx', import.meta.url), 'utf8').includes('key={recipe.slug}'));
  });
});

describe('recipe-scaling › Step chips scale', () => {
  test('a chip quantity follows the servings', () => {
    const chipSteps: Step[] = [{ body: 'meng', ingredients: [{ quantityText: '200 g', name: 'bloem' }] }];
    page({ recipe: { ...recipe, servings: 4 }, steps: chipSteps });
    fireEvent.change(screen.getByTestId('ScaleControl-field'), { target: { value: '6' } });
    assert.equal(screen.getByTestId('StepChips-quantity').textContent, '300 g');
  });
});

describe('recipe-scaling › Reload resets', () => {
  const field = () => screen.getByTestId<HTMLInputElement>('ScaleControl-field');

  test('pressing plus changes the servings', () => {
    page({ recipe: { ...recipe, servings: 4 } });
    fireEvent.click(screen.getByTestId('ScaleControl-more'));
    assert.equal(field().value, '5');
  });

  test('a fresh mount starts at the recipe own servings: nothing is stored', () => {
    page({ recipe: { ...recipe, servings: 4 } });
    fireEvent.click(screen.getByTestId('ScaleControl-more'));
    cleanup();
    page({ recipe: { ...recipe, servings: 4 } });
    assert.equal(field().value, '4');
  });
});

describe('recipe-scaling › Control sits above the lists', () => {
  for (const id of ['panel-ingredients', 'panel-steps']) {
    test(`the control comes before ${id}`, () => {
      page({ recipe: { ...recipe, servings: 4 } });
      const control = screen.getByTestId('ScaleControl-field');
      assert.ok(control.compareDocumentPosition(document.getElementById(id)!) & Node.DOCUMENT_POSITION_FOLLOWING);
    });
  }
});
