import assert from 'node:assert/strict';
import { createMemoryRouter, RouterContextProvider, RouterProvider } from 'react-router';
import { describe } from 'vitest';
import { envContext, userEmailContext } from '~app/shared/context.server';
import type { RecipeSummary } from '~app/shared/recipe';
import { createRecipe } from '~app/shared/recipes.server';
import { saveStaples } from '~app/shared/staples.server';
import { cssFor, mediaFor } from '~testing/css';
import { act, fireEvent, precedes, render, screen, within } from '~testing/dom';
import { fake } from '~testing/fake';
import { routePaths } from '~testing/routes';
import { test } from '~testing/test';
import type { Route } from './+types/FridgePageRoute';
import FridgePage, { loader, shouldRevalidate } from './FridgePageRoute';

const load = async (db: D1Database) => {
  const context = new RouterContextProvider();
  context.set(envContext, fake<Env>({ DB: db }));
  context.set(userEmailContext, 'oma@example.com');
  return loader(fake<Route.LoaderArgs>({ context }));
};

const summary = (title: string): RecipeSummary => ({
  slug: title.toLowerCase(),
  title,
  author: 'Oma',
  time: null,
  image: null,
  seal: null,
  tags: [],
  liked: false,
  hasNote: false,
});
type Data = Route.ComponentProps['loaderData'];
/** Recipes newest first, with their ingredients. */
const data = (): Data => ({
  recipes: ['Rijstepap', 'Kippensoep', 'Spruitenstamppot', 'Pannenkoeken'].map(summary),
  ingredients: {
    rijstepap: ['rijst', 'melk', 'kaneel', 'zout'],
    kippensoep: ['kip', 'ui', 'water'],
    spruitenstamppot: ['spruitjes', 'aardappel', 'kip'],
    pannenkoeken: ['bloem', 'melk', 'ei'],
  },
  staples: ['zout', 'water'],
});

let router: ReturnType<typeof createMemoryRouter>;
const renderAt = (url: string, loaderData: Data = data(), history: string[] = [url]) => {
  const props = { loaderData } as Route.ComponentProps;
  router = createMemoryRouter(
    [{ path: '/koelkast', element: <FridgePage {...props} /> }, ...(history.length > 1 ? [{ path: '/eerder', element: null }] : [])],
    {
      initialEntries: history,
      initialIndex: history.length - 1,
    },
  );
  return render(<RouterProvider router={router} />);
};
const shown = () => screen.queryAllByTestId('RecipeCard-link').map((a) => a.getAttribute('href')?.replace('/recepten/', ''));
const count = () => screen.getByTestId('FridgePage-count').textContent;
const listOf = (kind: string) => screen.getAllByTestId('IngredientList-list').find((l) => l.getAttribute('data-kind') === kind)!;
const chipsOf = (kind: string) =>
  within(listOf(kind))
    .queryAllByTestId('IngredientList-entry')
    .map((c) => c.textContent);
const add = (kind: string, text: string) => {
  fireEvent.change(within(listOf(kind)).getByTestId('IngredientList-input'), { target: { value: text } });
  fireEvent.click(within(listOf(kind)).getByTestId('IngredientList-button'));
};

describe('fridge-search › Opening the page', () => {
  test('the route table serves it', () => {
    assert.ok(routePaths.includes('koelkast'));
  });

  test('the loader gives the recipes newest first, their ingredients and the staples', async ({ db }) => {
    await createRecipe(db, { title: 'Oud', author: 'Oma', ingredients: [{ name: 'water', quantityText: '' }] });
    await createRecipe(db, { title: 'Jong', author: 'Oma', ingredients: [{ name: 'kip', quantityText: '' }] });
    await saveStaples(db, ['meel']);
    const loaded = await load(db);
    assert.deepEqual(
      loaded.recipes.map((r) => r.slug),
      ['jong', 'oud'],
    );
    assert.deepEqual(loaded.ingredients, { jong: ['kip'], oud: ['water'] });
    assert.deepEqual(loaded.staples, ['meel']);
  });

  test('the page has the heading, both lists and a card per recipe, newest first', () => {
    renderAt('/koelkast');
    assert.ok(screen.getByTestId('FridgePage-title').textContent);
    assert.deepEqual(
      screen.getAllByTestId('IngredientList-list').map((l) => l.getAttribute('data-kind')),
      ['heb', 'zonder'],
    );
    assert.deepEqual(shown(), ['rijstepap', 'kippensoep', 'spruitenstamppot', 'pannenkoeken']);
  });

  test('the heading comes before the lists and the lists before the cards', () => {
    renderAt('/koelkast');
    assert.ok(precedes(screen.getByTestId('FridgePage-title'), listOf('heb')));
    assert.ok(precedes(listOf('zonder'), screen.getAllByTestId('RecipeCard-card')[0]!));
  });

  test('cards show neither a count nor a plain part without Heb ik entries', () => {
    renderAt('/koelkast');
    assert.equal(screen.queryAllByTestId('FridgeCard-count').length, 0);
    assert.equal(screen.queryAllByTestId('RecipeCard-extra').length, 0);
  });
});

describe('fridge-search › No recipes stored', () => {
  test('the loader gives no recipes', async ({ db }) => {
    assert.deepEqual((await load(db)).recipes, []);
  });

  test('the page says there are none and links to the new recipe form', () => {
    renderAt('/koelkast', { recipes: [], ingredients: {}, staples: [] });
    assert.ok(screen.getByTestId('FridgePage-empty'));
    assert.equal(screen.getByTestId('FridgePage-add').getAttribute('href'), '/recepten/nieuw');
  });

  test('the page shows no lists', () => {
    renderAt('/koelkast', { recipes: [], ingredients: {}, staples: [] });
    assert.equal(screen.queryAllByTestId('IngredientList-list').length, 0);
  });
});

describe('fridge-search › Opening an address with lists', () => {
  test('the entries are in their lists', () => {
    renderAt('/koelkast?heb=kip&heb=rijst&zonder=spruitjes');
    assert.deepEqual(chipsOf('heb'), ['kip', 'rijst']);
    assert.deepEqual(chipsOf('zonder'), ['spruitjes']);
  });

  test('the recipes are narrowed to them, those that use more first', () => {
    renderAt('/koelkast?heb=kip&heb=rijst&heb=melk&zonder=spruitjes');
    assert.deepEqual(shown(), ['rijstepap', 'kippensoep', 'pannenkoeken']);
  });

  test('a card says how many of the entries it uses', () => {
    renderAt('/koelkast?heb=kip&heb=ui&heb=rijst');
    const [first] = screen.getAllByTestId('FridgeCard-count');
    assert.equal(first?.textContent, '2/3 in huis');
  });

  test('A–Z is chosen by the address', () => {
    renderAt('/koelkast?sort=az');
    assert.deepEqual(shown(), ['kippensoep', 'pannenkoeken', 'rijstepap', 'spruitenstamppot']);
  });
});

describe('fridge-search › Adding to the lists', () => {
  test('adding to Heb ik narrows the recipes', () => {
    renderAt('/koelkast');
    add('heb', 'melk');
    assert.deepEqual(shown(), ['rijstepap', 'pannenkoeken']);
  });

  test('the address has the entry', () => {
    renderAt('/koelkast');
    add('heb', 'melk');
    assert.equal(router.state.location.search, '?heb=melk');
  });

  test('a word moves to the other list', () => {
    renderAt('/koelkast?heb=ui');
    add('zonder', 'ui');
    assert.deepEqual([chipsOf('heb'), chipsOf('zonder')], [[], ['ui']]);
  });

  test('pressing + on a missing ingredient adds it to Heb ik', () => {
    renderAt('/koelkast?heb=rijst');
    const card = screen.getAllByTestId('RecipeCard-card')[0]!;
    fireEvent.click(within(within(card).getAllByTestId('MissingIngredients-row')[0]!).getByTestId('MissingIngredients-have'));
    assert.deepEqual(chipsOf('heb'), ['rijst', 'melk']);
  });

  test('pressing − on a missing ingredient adds it to Liever niet and hides the recipes with it', () => {
    renderAt('/koelkast?heb=rijst&heb=kip&heb=melk');
    const card = screen.getAllByTestId('RecipeCard-card')[0]!;
    fireEvent.click(within(within(card).getAllByTestId('MissingIngredients-row')[0]!).getByTestId('MissingIngredients-skip'));
    assert.deepEqual(chipsOf('zonder'), ['kaneel']);
    assert.deepEqual(shown(), ['kippensoep', 'spruitenstamppot', 'pannenkoeken']);
  });
});

describe('fridge-search › Changing a list does not fill the history', () => {
  test('the address is replaced, not pushed', () => {
    renderAt('/koelkast', data(), ['/eerder', '/koelkast']);
    add('heb', 'kip');
    assert.equal(router.state.historyAction, 'REPLACE');
  });

  test('one step back leads to the page before', async () => {
    renderAt('/koelkast', data(), ['/eerder', '/koelkast']);
    add('heb', 'kip');
    add('heb', 'ui');
    await act(() => router.navigate(-1));
    assert.equal(router.state.location.pathname, '/eerder');
  });
});

describe('fridge-search › Count with a list', () => {
  test('the page says how many of the recipes are shown', () => {
    renderAt('/koelkast?heb=melk');
    assert.equal(count(), '2 van 4 recepten');
  });
});

describe('fridge-search › Count without a list', () => {
  test('the page says how many recipes there are', () => {
    renderAt('/koelkast');
    assert.equal(count(), '4 recepten');
  });
});

describe('fridge-search › Nothing found', () => {
  test.beforeEach(() => {
    renderAt('/koelkast?heb=zzz');
  });

  test('no cards are shown', () => {
    assert.deepEqual(shown(), []);
  });

  test('the page says nothing was found', () => {
    assert.ok(screen.getByTestId('FridgePage-none'));
  });

  test('the page offers Wis alles after the count', () => {
    assert.ok(precedes(screen.getByTestId('FridgePage-count'), screen.getByTestId('FridgePage-none')));
    assert.ok(screen.getByTestId('FridgePage-clear'));
  });
});

describe('fridge-search › Clearing everything', () => {
  test.beforeEach(() => {
    renderAt('/koelkast?heb=kip&zonder=ui&sort=az');
    fireEvent.click(screen.getByTestId('FridgePage-clear'));
  });

  test('both lists are empty', () => {
    assert.deepEqual([chipsOf('heb'), chipsOf('zonder')], [[], []]);
  });

  test('Nieuwste is selected', () => {
    assert.equal(screen.getAllByTestId<HTMLInputElement>('FridgePage-sort').find((i) => i.value === 'nieuwste')?.checked, true);
  });

  test('all recipes are shown', () => {
    assert.equal(shown().length, 4);
  });

  test('the address has no parameters', () => {
    assert.equal(router.state.location.search, '');
  });
});

describe('fridge-search › Choosing the order', () => {
  test('selecting A–Z orders the recipes by title', () => {
    renderAt('/koelkast');
    fireEvent.click(screen.getAllByTestId<HTMLInputElement>('FridgePage-sort').find((i) => i.value === 'az')!);
    assert.deepEqual(shown(), ['kippensoep', 'pannenkoeken', 'rijstepap', 'spruitenstamppot']);
  });

  test('without lists and with the default order there is no Wis alles', () => {
    renderAt('/koelkast');
    assert.equal(screen.queryByTestId('FridgePage-clear'), null);
  });
});

// Needs real scrolling on a phone.
test.todo('fridge-search › Scrolling on a phone');

describe('fridge-search › Narrow screen', () => {
  test('the lists are one column, so Heb ik is above Liever niet', async () => {
    renderAt('/koelkast');
    const css = (await cssFor(screen.getByTestId('FridgePage-lists').className)).replace(/\s+/g, ' ');
    assert.match(css, /display: grid/);
    assert.equal(css.split('@media')[0]?.includes('grid-template-columns'), false);
  });

  test('the lists are before each other in the page', () => {
    renderAt('/koelkast');
    assert.ok(precedes(listOf('heb'), listOf('zonder')));
  });
});

describe('fridge-search › Wide screen', () => {
  test('the lists are two columns from 48rem', async () => {
    renderAt('/koelkast');
    assert.match(
      await mediaFor(screen.getByTestId('FridgePage-lists').className, '(width >= 48rem)'),
      /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/,
    );
  });
});

describe('fridge-search › The lists scroll with the page', () => {
  test('the lists are neither fixed nor sticky', async () => {
    renderAt('/koelkast');
    assert.doesNotMatch(await cssFor(screen.getByTestId('FridgePage-lists').className), /position: (fixed|sticky)/);
  });
});

// Needs a real pointer: hover is gated behind (hover: hover) and resolves per element in a browser.
test.todo('fridge-search › Hover tints, not raises');

describe('shouldRevalidate', () => {
  const url = (s: string) => new URL(`https://cookbook.test/${s}`);
  const args = (from: string, to: string, defaultShouldRevalidate = true) =>
    ({ currentUrl: url(from), nextUrl: url(to), defaultShouldRevalidate }) as Parameters<typeof shouldRevalidate>[0];

  test('changing a list does not fetch again', () => {
    assert.equal(shouldRevalidate(args('koelkast', 'koelkast?heb=kip')), false);
  });

  test('coming from another page fetches again', () => {
    assert.equal(shouldRevalidate(args('', 'koelkast')), true);
  });
});
