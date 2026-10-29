import assert from 'node:assert/strict';
import type { ComponentProps } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, test } from 'vitest';
import type { Recipe, Step } from '~app/shared/recipe';
import { cssFor, hidesAt } from '~testing/css';
import { cleanup, fireEvent, precedes, render, screen, setViewport } from '~testing/dom';
import { RecipeView } from './RecipeView';
import { scaleIngredient, scaleText } from './scale/scale';

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
  source: null,
  seal: null,
  tags: [],
  ingredients: [
    { quantityText: '4', quantityValue: null, quantityUnit: null, name: 'appels' },
    { quantityText: '100 g', quantityValue: null, quantityUnit: null, name: 'suiker' },
  ],
};

const page = (props: Partial<ComponentProps<typeof RecipeView>> = {}) =>
  // A data router, because the page holds a router `Form` (delete button).
  render(<RouterProvider router={createMemoryRouter([{ path: '/', element: <RecipeView recipe={recipe} tile={0} steps={steps} {...props} /> }])} />);
/** The sticky bar with the tabs and the timer dock. */
const stack = () => screen.getByTestId('RecipeView-stack');
const tabs = () => screen.getAllByTestId('TabBar-tab');
const ingredientsPanel = () => screen.getByTestId('RecipeView-ingredients');
const stepsPanel = () => screen.getByTestId('RecipeView-steps');
const checkboxes = () => screen.getAllByTestId<HTMLInputElement>('IngredientList-checkbox');

const hiddenNarrow = (el: HTMLElement) => hidesAt(el.className, '(width < 51.99rem)');

describe('recipe-viewing › Tabs on a narrow screen', () => {
  test('the tab bar with its two tabs is in the sticky bar', () => {
    page();
    assert.ok(stack().contains(screen.getByTestId('TabBar-list')));
    assert.equal(tabs().length, 2);
  });

  test('the bar sticks to the top', async () => {
    page();
    assert.match(await cssFor(stack().className), /position: sticky/);
  });

  test('the bar is only there below 52rem', async () => {
    page();
    assert.ok(await hidesAt(stack().className, '(width >= 52rem)'));
  });

  test('one panel at a time is shown below 52rem', async () => {
    page();
    assert.ok(await hiddenNarrow(stepsPanel()));
    assert.ok(!(await hiddenNarrow(ingredientsPanel())));
  });

  test('choosing the other tab swaps which panel is hidden', async () => {
    page();
    fireEvent.click(tabs()[1]);
    assert.ok(!(await hiddenNarrow(stepsPanel())));
    assert.ok(await hiddenNarrow(ingredientsPanel()));
  });
});

// Needs layout: from 52rem both panels are shown side by side and the ingredients scroll away with the page.
test.todo('recipe-viewing › Two columns on a wide screen');

// The page scrolling as a whole needs layout; checked here: the column has no sticky or scrolling behaviour of its own.
describe('recipe-viewing › Long ingredient list on a wide screen', () => {
  test('the column and its lists have no sticky or scrolling behaviour', async () => {
    page();
    const column = ingredientsPanel();
    for (const el of [column, ...column.querySelectorAll('ul')]) {
      assert.doesNotMatch(await cssFor(el.className), /position: sticky|overflow|max-height/);
    }
  });
});

describe('RecipeView note', () => {
  beforeEach(() => {
    page({ liked: true, note: 'minder zout' });
  });

  test('the leaf comes before "Bewerk"', () => {
    assert.ok(precedes(screen.getByTestId('LikeButton-leaf'), screen.getByTestId('RecipeView-edit')));
  });

  test('the note panel sits under the ingredients', () => {
    const column = ingredientsPanel();
    assert.ok(column.contains(screen.getByTestId('NotePanel-panel')));
    assert.ok(precedes(column.querySelector('ul')!, screen.getByTestId('NotePanel-panel')));
  });

  test('the note sheet button is there', () => {
    assert.ok(screen.getByTestId('NoteSheet-button'));
  });
});

// Needs layout: a tab is at least the screen height minus the measured sticky stack, so a short list sits at the top of its panel.
test.todo('recipe-viewing › Short tab content');

describe('recipe-viewing › Ticked ingredients are kept', () => {
  test('both panels stay mounted', () => {
    page();
    assert.ok(ingredientsPanel() && stepsPanel());
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
});

// Needs a browser: the position is kept by a scroll listener while the stack is stuck, and survives scrolling up out of that state.
test.todo('recipe-viewing › Position survives scrolling up');

describe('recipe-viewing › Optional fields are empty', () => {
  // No time, no servings and no image: the page still renders, without them.
  test('the title and author still show', () => {
    page();
    assert.equal(screen.getByTestId('RecipeView-title').textContent, 'Appeltaart');
    assert.equal(screen.getByTestId('RecipeView-author').textContent, 'van Oma');
  });

  test('no time, servings or image show', () => {
    page();
    assert.equal(screen.queryByTestId('RecipeView-time'), null);
    assert.equal(screen.queryByTestId('RecipeView-servings'), null);
    assert.equal(screen.queryByTestId('RecipeView-image'), null);
  });

  test('with them, the time and servings are shown', () => {
    page({ recipe: { ...recipe, time: '1 uur', servings: 6, image: '/taart.jpg' } });
    assert.equal(screen.getByTestId('RecipeView-time').textContent, '1 uur');
    assert.equal(screen.getByTestId('RecipeView-servings').textContent, '6 porties');
  });

  test('with them, the image is shown', () => {
    page({ recipe: { ...recipe, time: '1 uur', servings: 6, image: '/taart.jpg' } });
    assert.ok(screen.getByTestId('RecipeView-image'));
  });
});

describe('recipe-viewing › Ingredient without quantity', () => {
  const ingredients = [
    { quantityText: '', quantityValue: null, quantityUnit: null, name: 'zout' },
    { quantityText: '100 g', quantityValue: null, quantityUnit: null, name: 'suiker' },
  ];

  test('is shown with its name only: the quantity cell is empty', () => {
    page({ recipe: { ...recipe, ingredients } });
    const quantities = screen.getAllByTestId('IngredientList-quantity');
    assert.deepEqual(
      quantities.map((q) => q.textContent),
      ['', '100 g'],
    );
    assert.deepEqual(
      screen.getAllByTestId('IngredientList-name').map((n) => n.textContent),
      ['zout', 'suiker'],
    );
  });
});

describe('recipe-deletion › No delete button on the recipe page', () => {
  test('the page has no delete button', () => {
    page();
    assert.equal(screen.queryByTestId('DeleteRecipe-open'), null);
  });
});

describe('recipe-viewing › Link to the edit form', () => {
  test('the edit button points at the edit address', () => {
    page();
    assert.equal(screen.getByTestId('RecipeView-edit').getAttribute('href'), '/recepten/appeltaart/bewerken');
  });
});

describe('cook-mode › Switch on a narrow screen', () => {
  beforeEach(() => {
    page();
  });

  test('the switch sits directly above the sticky stack and is not part of it', () => {
    const toggle = screen.getByTestId('CookSwitch-switch');
    assert.ok(precedes(toggle, stack()) && !stack().contains(toggle));
  });

  test('the switch is off at first', () => {
    assert.equal(screen.getByTestId('CookSwitch-switch').getAttribute('aria-checked'), 'false');
  });
});

describe('cook-mode › No cook mode on a wide screen', () => {
  // The switch is hidden from 52rem on, and the decision never wants the lock there (see cookMode.test.ts).
  test('the switch is hidden from 52rem', async () => {
    page();
    assert.ok(await hidesAt(screen.getByTestId('CookSwitch-label').className, '(width >= 52rem)'));
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

  test('turning it off by hand switches it off', () => {
    page();
    turnOff();
    assert.equal(screen.getByTestId('CookSwitch-switch').getAttribute('aria-checked'), 'false');
  });

  test('turning it off by hand changes the explanation', () => {
    page();
    const automatic = screen.getByTestId('CookSwitch-sub').textContent;
    turnOff();
    assert.notEqual(screen.getByTestId('CookSwitch-sub').textContent, automatic);
  });

  test('a new page is automatic again', () => {
    page();
    const automatic = screen.getByTestId('CookSwitch-sub').textContent;
    turnOff();
    cleanup();
    page();
    assert.equal(screen.getByTestId('CookSwitch-switch').getAttribute('aria-checked'), 'true');
    assert.equal(screen.getByTestId('CookSwitch-sub').textContent, automatic);
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

  // Needs the route: RecipePageRoute keys the page by the recipe slug, so a loader and navigation are involved.
  test.todo('another recipe gets a fresh page: the route keys the page by the recipe slug');
});

describe('recipe-scaling › Step chips scale', () => {
  test('a chip quantity follows the servings', () => {
    const chipSteps: Step[] = [{ body: 'meng', ingredients: [{ quantityText: '200 g', quantityValue: 200, quantityUnit: 'g', name: 'bloem' }] }];
    page({ recipe: { ...recipe, servings: 4 }, steps: chipSteps });
    fireEvent.change(screen.getByTestId('ScaleControl-field'), { target: { value: '6' } });
    assert.equal(screen.getByTestId('StepChips-quantity').textContent, '300 g');
  });
});

describe('chip without a stored value', () => {
  test('a chip without a value keeps its text when doubled', () => {
    const chipSteps: Step[] = [{ body: 'bak', ingredients: [{ quantityText: '2-3 el', quantityValue: null, quantityUnit: null, name: 'olie' }] }];
    page({ recipe: { ...recipe, servings: 4 }, steps: chipSteps });
    fireEvent.change(screen.getByTestId('ScaleControl-field'), { target: { value: '8' } });
    assert.equal(screen.getByTestId('StepChips-quantity').textContent, '2-3 el');
  });
});

describe('recipe-scaling › Chip keeps its own unit', () => {
  test('a chip with a non-rules unit keeps it when doubled', () => {
    const chipSteps: Step[] = [
      { body: 'bak', ingredients: [{ quantityText: '1 klontje', quantityValue: 1, quantityUnit: 'klontje', name: 'boter' }] },
    ];
    page({ recipe: { ...recipe, servings: 4 }, steps: chipSteps });
    fireEvent.change(screen.getByTestId('ScaleControl-field'), { target: { value: '8' } });
    assert.equal(screen.getByTestId('StepChips-quantity').textContent, '2 klontje');
  });
});

describe('RecipeView step text scaling', () => {
  test('the step text is the stored amounts times the factor', () => {
    const quantities = [{ startIndex: 5, endIndex: 8, quantityValue: 200, quantityUnit: 'g' }];
    page({ recipe: { ...recipe, servings: 4 }, steps: [{ body: 'Meng 200 g bloem', ingredients: [], quantities }] });
    fireEvent.change(screen.getByTestId('ScaleControl-field'), { target: { value: '6' } });
    assert.equal(screen.getByTestId('StepItem-body').textContent, scaleText('Meng 200 g bloem', quantities, 6 / 4));
  });
});

describe('RecipeView ingredient list scaling', () => {
  test('the list quantities are the stored values times the factor', () => {
    const ingredients = [
      { quantityText: '200 g', quantityValue: 200, quantityUnit: 'g', name: 'bloem' },
      { quantityText: '1 el', quantityValue: 1, quantityUnit: 'el', name: 'olie' },
    ];
    page({ recipe: { ...recipe, servings: 4, ingredients } });
    fireEvent.change(screen.getByTestId('ScaleControl-field'), { target: { value: '6' } });
    assert.deepEqual(
      screen.getAllByTestId('IngredientList-quantity').map((q) => q.textContent),
      ingredients.map((i) => scaleIngredient(i, 6 / 4)),
    );
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
  for (const id of ['RecipeView-ingredients', 'RecipeView-steps']) {
    test(`the control comes before ${id}`, () => {
      page({ recipe: { ...recipe, servings: 4 } });
      const control = screen.getByTestId('ScaleControl-field');
      assert.ok(control.compareDocumentPosition(screen.getByTestId(id)) & Node.DOCUMENT_POSITION_FOLLOWING);
    });
  }
});

describe('recipe-scaling › Ingredient range scales', () => {
  test('the list shows the doubled range', () => {
    const ingredients = [{ quantityText: '2-3 el', quantityValue: 2, quantityValueMax: 3, quantityUnit: 'el', name: 'olie' }];
    page({ recipe: { ...recipe, servings: 4, ingredients } });
    fireEvent.change(screen.getByTestId('ScaleControl-field'), { target: { value: '8' } });
    assert.equal(screen.getByTestId('IngredientList-quantity').textContent, scaleIngredient(ingredients[0], 2));
  });
});

describe('recipe-scaling › Chip range scales', () => {
  test('the chip shows the doubled range', () => {
    const chip = { quantityText: '1 tot 2 el', quantityValue: 1, quantityValueMax: 2, quantityUnit: 'el', name: 'olie' };
    page({ recipe: { ...recipe, servings: 4 }, steps: [{ body: 'bak', ingredients: [chip] }] });
    fireEvent.change(screen.getByTestId('ScaleControl-field'), { target: { value: '8' } });
    assert.equal(screen.getByTestId('StepChips-quantity').textContent, scaleIngredient(chip, 2));
  });
});

describe('recipe-scaling › Range in step text keeps its words', () => {
  test('both numbers of the range are replaced', () => {
    const body = 'Voeg 2 à 3 el olie toe';
    const quantities = [{ startIndex: 5, endIndex: 6, quantityValue: 2, quantityValueMax: 3, maxStartIndex: 9, maxEndIndex: 10, quantityUnit: 'el' }];
    page({ recipe: { ...recipe, servings: 4 }, steps: [{ body, ingredients: [], quantities }] });
    fireEvent.change(screen.getByTestId('ScaleControl-field'), { target: { value: '8' } });
    assert.equal(screen.getByTestId('StepItem-body').textContent, scaleText(body, quantities, 2));
  });
});

const withSource = (source: string | null) => page({ recipe: { ...recipe, source } });
const shown = () => screen.getByTestId('RecipeView-source');

describe('recipe-source › Text source', () => {
  test('the text is shown', () => {
    withSource('Buurvrouw Marie');
    assert.equal(shown().textContent, 'Buurvrouw Marie');
  });

  test('it is not a link', () => {
    withSource('Buurvrouw Marie');
    assert.equal(shown().getAttribute('href'), null);
  });
});

describe('recipe-source › Link source', () => {
  const address = 'https://www.smulweb.nl/recepten/123/appeltaart';

  test('the link goes to the address', () => {
    withSource(address);
    assert.equal(shown().getAttribute('href'), address);
  });

  test('the text is the host', () => {
    withSource(address);
    assert.equal(shown().textContent, 'smulweb.nl');
  });

  test('it opens in a new tab', () => {
    withSource(address);
    assert.equal(shown().getAttribute('target'), '_blank');
  });

  test('it passes no referrer or opener', () => {
    withSource(address);
    assert.equal(shown().getAttribute('rel'), 'noopener noreferrer');
  });
});

describe('recipe-source › Other schemes are not links', () => {
  for (const source of ['javascript:alert(1)', 'ftp://example.com/x'])
    test(`${source} is plain text`, () => {
      withSource(source);
      assert.deepEqual([shown().textContent, shown().getAttribute('href')], [source, null]);
    });
});

describe('recipe-source › Text containing a link', () => {
  test('it is plain text', () => {
    withSource('zie https://example.com');
    assert.deepEqual([shown().textContent, shown().getAttribute('href')], ['zie https://example.com', null]);
  });
});

describe('recipe-source › Recipe without a source', () => {
  test('the page has no source item', () => {
    withSource(null);
    assert.equal(screen.queryByTestId('RecipeView-source'), null);
  });
});
