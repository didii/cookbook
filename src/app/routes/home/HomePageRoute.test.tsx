import assert from 'node:assert/strict';
import { createMemoryRouter, RouterContextProvider, RouterProvider, useLoaderData } from 'react-router';
import { afterEach, describe } from 'vitest';
import { envContext, userEmailContext } from '~app/shared/context.server';
import type { RecipeSummary } from '~app/shared/recipe';
import { createRecipe } from '~app/shared/recipes.server';
import { cssFor } from '~testing/css';
import { act, fireEvent, precedes, render, screen } from '~testing/dom';
import { fake } from '~testing/fake';
import { test } from '~testing/test';
import type { Route } from './+types/HomePageRoute';
import HomePage, { loader, shouldRevalidate } from './HomePageRoute';
import { filterParams, noFilters } from './lib/filterRecipes';

const load = async (db: D1Database) => {
  const context = new RouterContextProvider();
  context.set(envContext, fake<Env>({ DB: db }));
  context.set(userEmailContext, 'oma@example.com');
  return (await loader(fake<Route.LoaderArgs>({ context }))).recipes;
};

/** The page for a list of recipes at an address. */
const renderAt = (url: string, recipes: RecipeSummary[]) => {
  const props = { loaderData: { recipes } } as Route.ComponentProps;
  return render(<RouterProvider router={createMemoryRouter([{ path: '/', element: <HomePage {...props} /> }], { initialEntries: [url] })} />);
};
/** The slugs of the cards on the page, in order. */
const shownTitles = () => screen.queryAllByTestId('RecipeCard-link').map((a) => a.getAttribute('href')?.replace('/recepten/', ''));
const chip = (name: string) => screen.getAllByTestId('FilterBar-chip').find((c) => c.textContent === name)!;
const sortInput = (value: string) => screen.getAllByTestId<HTMLInputElement>('FilterBar-sort').find((i) => i.value === value)!;
/** The "n recepten" line. */
const count = () => screen.getByTestId('HomePage-count').textContent;
const searchBox = () => screen.getByTestId<HTMLInputElement>('FilterBar-search');

// Empty the database first: other describes add recipes.
describe('recipe-browsing › No recipes yet', () => {
  test('the loader returns no recipes', async ({ db }) => {
    assert.deepEqual(await load(db), []);
  });

  test('the page shows the empty message', async ({ db }) => {
    renderAt('/', await load(db));
    assert.ok(screen.getByTestId('HomePage-empty'));
  });

  test('the page links to adding a recipe', async ({ db }) => {
    renderAt('/', await load(db));
    assert.equal(screen.getByTestId('HomePage-add').getAttribute('href'), '/recepten/nieuw');
  });

  test('the page offers no search or filter controls', async ({ db }) => {
    const { container } = renderAt('/', await load(db));
    assert.equal(container.querySelector('output, input'), null);
  });
});

describe('recipe-browsing › Recipe without time or image', () => {
  const cardOf = async (db: D1Database) => {
    const slug = await createRecipe(db, { title: 'Kaal', author: 'Oma' });
    return (await load(db)).find((r) => r.slug === slug);
  };

  test('the loader gives no time and no image', async ({ db }) => {
    const card = await cardOf(db);
    assert.equal(card?.time, null);
    assert.equal(card?.image, null);
  });

  test('the card shows no image', async ({ db }) => {
    renderAt('/', [(await cardOf(db))!]);
    assert.equal(screen.getByTestId('RecipeCard-link').querySelector('img'), null);
  });
});

describe('recipe-browsing › Stored recipes are listed', () => {
  test('the newest recipes come first', async ({ db }) => {
    const first = await createRecipe(db, { title: 'Eerste', author: 'Papa', time: '30 min', image: '/a.jpg' });
    const second = await createRecipe(db, { title: 'Tweede', author: 'Mama' });
    const slugs = (await load(db)).map((r) => r.slug);
    assert.deepEqual(slugs.slice(0, 2), [second, first]);
  });
});

describe('recipe-browsing › A new recipe appears', () => {
  const shownCount = async (db: D1Database) => {
    const view = renderAt('/', await load(db));
    const n = Number.parseInt(count() ?? '', 10); // the number leads the line
    view.unmount();
    return n;
  };

  test('the page counts the stored recipes', async ({ db }) => {
    await createRecipe(db, { title: 'Bestaand', author: 'Oma' });
    assert.equal(await shownCount(db), (await load(db)).length);
  });

  test('the loader lists the new recipe first', async ({ db }) => {
    const listed = await load(db);
    const slug = await createRecipe(db, { title: 'Nieuw', author: 'Opa' });
    const relisted = await load(db);
    assert.equal(relisted.length, listed.length + 1);
    assert.equal(relisted[0]?.slug, slug);
  });

  test('the page count includes the new recipe', async ({ db }) => {
    await createRecipe(db, { title: 'Nieuw', author: 'Opa' });
    assert.equal(await shownCount(db), (await load(db)).length);
  });
});

describe('recipe-browsing › Welcome above the recipes', () => {
  test('the title comes before the intro and the intro before the list', async ({ db }) => {
    await createRecipe(db, { title: 'Bestaand', author: 'Oma' });
    const { container } = renderAt('/', await load(db));
    const heading = screen.getByTestId('HomePage-title');
    const intro = screen.getByTestId('HomePage-intro');
    assert.ok(precedes(heading, intro) && precedes(intro, container.querySelector('ul')!));
  });
});

// Filtering runs in the browser over the loaded list, so these render the page for a given list and address.
const summary = (title: string, author: string): RecipeSummary => ({
  slug: title.toLowerCase(),
  title,
  author,
  time: null,
  image: null,
  seal: null,
  tags: [],
  liked: false,
  hasNote: false,
});
const family = [
  summary('Erwtensoep', 'Papa'),
  summary('Appeltaart', 'Oma'),
  summary('Pannenkoeken', 'Tante An'),
  summary('Stoofvlees', 'Papa'),
  summary('Rijstpap', 'Mama'),
];
const twelve = Array.from({ length: 12 }, (_, i) => summary(i < 3 ? `Soep ${i}` : `Gerecht ${i}`, 'Oma'));

describe('recipe-filtering › Few recipes', () => {
  test('only the search box is offered', () => {
    renderAt('/', family.slice(0, 3));
    assert.ok(searchBox());
    assert.equal(screen.queryAllByTestId('FilterBar-chip').length, 0);
    assert.equal(screen.queryAllByTestId('FilterBar-sort').length, 0);
  });

  test('the chips are offered once there are more recipes', () => {
    renderAt('/', family);
    assert.ok(screen.getAllByTestId('FilterBar-chip').length > 0);
  });

  // An address that sets author or order is ignored when those controls are not offered, since they could not be undone.
  test('an address with author or order is ignored', () => {
    renderAt('/?auteur=Papa&sort=az', family.slice(0, 3));
    assert.deepEqual(shownTitles(), ['erwtensoep', 'appeltaart', 'pannenkoeken']);
  });
});

describe('recipe-filtering › Count with a filter', () => {
  test('shows how many of the total match', () => {
    renderAt('/?q=soep', twelve);
    assert.equal(count(), '3 van 12 recepten');
  });
});

describe('recipe-filtering › Count without a filter', () => {
  test('shows the total', () => {
    renderAt('/', twelve);
    assert.equal(count(), '12 recepten');
  });
});

describe('recipe-filtering › Nothing found', () => {
  test.beforeEach(() => {
    renderAt('/?q=zzz', family);
  });

  test('no cards are shown', () => {
    assert.deepEqual(shownTitles(), []);
  });

  test('the nothing-found message is shown', () => {
    assert.ok(screen.getByTestId('HomePage-none'));
  });

  // The way out sits with the message, after the count, and the search box keeps what was typed.
  test('the way out comes after the count', () => {
    assert.ok(precedes(screen.getByTestId('HomePage-count'), screen.getByTestId('HomePage-clear')));
  });

  test('the search box keeps what was typed', () => {
    assert.equal(searchBox().value, 'zzz');
  });
});

describe('recipe-filtering › Clearing all filters', () => {
  // "Wis filters" navigates to the address without filter parameters; that address shows everything with the defaults chosen.
  test('no filters make an address without parameters', () => {
    assert.equal(filterParams(noFilters).toString(), '');
  });

  describe('the address without parameters', () => {
    test.beforeEach(() => {
      renderAt('/', family);
    });

    test('shows every recipe', () => {
      assert.equal(shownTitles().length, family.length);
    });

    test('chooses Iedereen', () => {
      assert.equal(chip('Iedereen').getAttribute('aria-pressed'), 'true');
    });

    test('chooses the newest order', () => {
      assert.equal(sortInput('nieuwste').checked, true);
    });

    test('leaves the search box empty', () => {
      assert.equal(searchBox().value, '');
    });
  });

  // Using the button from the nothing-found message gets there.
  describe('the clear button', () => {
    test.beforeEach(() => {
      renderAt('/?q=zzz&auteur=Papa&sort=az', family);
      fireEvent.click(screen.getByTestId('HomePage-clear'));
    });

    test('shows every recipe', () => {
      assert.equal(shownTitles().length, family.length);
    });

    test('empties the search box', () => {
      assert.equal(searchBox().value, '');
    });

    test('chooses Iedereen', () => {
      assert.equal(chip('Iedereen').getAttribute('aria-pressed'), 'true');
    });
  });
});

describe('recipe-filtering › Opening a filtered address', () => {
  test('the search text fills the search box', () => {
    renderAt('/?q=appel', family);
    assert.equal(searchBox().value, 'appel');
  });

  test('the search text narrows the list', () => {
    renderAt('/?q=appel', family);
    assert.deepEqual(shownTitles(), ['appeltaart']);
  });

  // Author and order come from the address too.
  test('the author and order narrow and sort the list', () => {
    renderAt('/?auteur=Papa&sort=az', family);
    assert.deepEqual(shownTitles(), ['erwtensoep', 'stoofvlees']);
  });

  test('the author chip is pressed', () => {
    renderAt('/?auteur=Papa&sort=az', family);
    assert.equal(chip('Papa').getAttribute('aria-pressed'), 'true');
  });
});

describe('shouldRevalidate', () => {
  const url = (s: string) => new URL(`https://cookbook.test/${s}`);
  const args = (from: string, to: string, defaultShouldRevalidate = true) =>
    ({ currentUrl: url(from), nextUrl: url(to), defaultShouldRevalidate }) as Parameters<typeof shouldRevalidate>[0];

  test('typing a first search does not fetch again', () => {
    assert.equal(shouldRevalidate(args('', '?q=a')), false);
  });

  test('changing the search and the order does not fetch again', () => {
    assert.equal(shouldRevalidate(args('?q=a', '?q=ab&sort=az')), false);
  });

  test('clearing the search does not fetch again', () => {
    assert.equal(shouldRevalidate(args('?q=a', '')), false);
  });

  test('coming from another page fetches again', () => {
    assert.equal(shouldRevalidate(args('recepten/nieuw', '')), true);
  });

  test('the same address fetches again', () => {
    assert.equal(shouldRevalidate(args('', '')), true);
  });

  test('another page follows the default when it says not to fetch', () => {
    assert.equal(shouldRevalidate(args('recepten/nieuw', '', false)), false);
  });
});

describe('recipe-filtering › Filtering does not fill the history', () => {
  // A memory history stands in for the browser's: one step back from the home page leads to the page before it, however much was typed.
  const props = { loaderData: { recipes: family } } as Route.ComponentProps;
  let router: ReturnType<typeof createMemoryRouter>;

  test.beforeEach(() => {
    router = createMemoryRouter(
      [
        { path: '/', element: <HomePage {...props} /> },
        { path: '/eerder', element: null },
      ],
      { initialEntries: ['/eerder', '/'], initialIndex: 1 },
    );
    render(<RouterProvider router={router} />);
    fireEvent.change(searchBox(), { target: { value: 'a' } });
    fireEvent.change(searchBox(), { target: { value: 'ap' } });
  });

  test('the search is in the address', () => {
    assert.equal(router.state.location.search, '?q=ap');
  });

  test('the address is replaced, not pushed', () => {
    assert.equal(router.state.historyAction, 'REPLACE');
  });

  test('one step back leads to the page before', async () => {
    await act(() => router.navigate(-1));
    assert.equal(router.state.location.pathname, '/eerder');
  });
});

describe('recipe-filtering › Reaching the last recipe', () => {
  // The page keeps room under the list for the fixed bar and the safe area on phones, and returns to normal spacing from 48rem.
  const mainCss = async () => {
    renderAt('/', family);
    return (await cssFor(screen.getByTestId('HomePage-main').className)).replace(/\s+/g, ' ');
  };

  test('keeps room for the fixed bar and the safe area', async () => {
    assert.match(await mainCss(), /padding-bottom: calc\(7rem \+ env\(safe-area-inset-bottom\)\)/);
  });

  test('returns to normal spacing from 48rem', async () => {
    assert.match(await mainCss(), /@media \(width >= 48rem\) \{[^@]*padding-bottom: calc\(var\(--spacing\) \* 16\)/);
  });
});

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});
const sent: string[] = [];
/** The page with a list the "server" changes when a like is posted, so a refetch shows it. */
const setup = (liked: boolean) => {
  const list = [{ ...summary('Erwtensoep', 'Papa'), liked }];
  sent.length = 0;
  globalThis.fetch = ((url: string, init: RequestInit) => {
    sent.push(`${url} ${String(init.body)}`);
    list[0]!.liked = String(init.body).includes('true');
    return Promise.resolve(new Response(null, { status: 204 }));
  }) as typeof fetch;
  const Page = () => <HomePage {...({ loaderData: useLoaderData() } as Route.ComponentProps)} />;
  const router = createMemoryRouter([{ path: '/', loader: () => ({ recipes: structuredClone(list) }), Component: Page }], {
    initialEntries: ['/'],
  });
  return render(<RouterProvider router={router} />);
};
const leaf = () => screen.getByTestId('LikeButton-leaf');
const pressLeaf = () => act(async () => void fireEvent.click(leaf()));

describe('recipe-like › Liking from a card', () => {
  test('the leaf shows liked', async () => {
    setup(false);
    await screen.findByTestId('LikeButton-leaf');
    await pressLeaf();
    assert.equal(leaf().getAttribute('aria-pressed'), 'true');
  });

  test('the like is stored with a request', async () => {
    setup(false);
    await screen.findByTestId('LikeButton-leaf');
    await pressLeaf();
    assert.deepEqual(sent, ['/recepten/erwtensoep/favoriet liked=true']);
  });

  test('the member stays on the home page', async () => {
    setup(false);
    await screen.findByTestId('LikeButton-leaf');
    await pressLeaf();
    assert.ok(screen.getByTestId('HomePage-title'));
  });
});

describe('recipe-like › Unliking from a card', () => {
  test('the leaf shows not liked', async () => {
    setup(true);
    await screen.findByTestId('LikeButton-leaf');
    await pressLeaf();
    assert.equal(leaf().getAttribute('aria-pressed'), 'false');
  });

  test('the removal is sent', async () => {
    setup(true);
    await screen.findByTestId('LikeButton-leaf');
    await pressLeaf();
    assert.deepEqual(sent, ['/recepten/erwtensoep/favoriet liked=false']);
  });
});

describe('recipe-like › A like from a card is kept', () => {
  test('the card shows the leaf liked after hiding and showing it', async () => {
    setup(false);
    await screen.findByTestId('LikeButton-leaf');
    await pressLeaf();
    await act(async () => void fireEvent.change(searchBox(), { target: { value: 'zzz' } }));
    assert.equal(screen.queryAllByTestId('LikeButton-leaf').length, 0);
    await act(async () => void fireEvent.change(searchBox(), { target: { value: '' } }));
    assert.equal(leaf().getAttribute('aria-pressed'), 'true');
  });
});
