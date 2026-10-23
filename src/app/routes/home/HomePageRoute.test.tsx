import assert from 'node:assert/strict';
import { createMemoryRouter, MemoryRouter, RouterContextProvider, RouterProvider } from 'react-router';
import { afterAll, beforeAll, beforeEach, describe, test } from 'vitest';
import { envContext, userEmailContext } from '~app/shared/context.server';
import type { RecipeSummary } from '~app/shared/recipe';
import { createRecipe } from '~app/shared/recipes.server';
import { cssFor } from '~testing/css';
import { createTestDb } from '~testing/db';
import { act, fireEvent, precedes, render, screen, within } from '~testing/dom';
import { fake } from '~testing/fake';
import type { Route } from './+types/HomePageRoute';
import HomePage, { loader, shouldRevalidate } from './HomePageRoute';
import { filterParams, noFilters } from './lib/filterRecipes';

// Real loader against an in-memory D1 holding the recipes the test inserted.
let db: D1Database;
let dispose: () => Promise<void>;

beforeAll(async () => {
  ({ db, dispose } = await createTestDb());
});

afterAll(() => dispose());

const load = async () => {
  const context = new RouterContextProvider();
  context.set(envContext, fake<Env>({ DB: db }));
  context.set(userEmailContext, 'oma@example.com');
  return (await loader(fake<Route.LoaderArgs>({ context }))).recipes;
};

/** The page for a list of recipes at an address. */
const renderAt = (url: string, recipes: RecipeSummary[]) => {
  const props = { loaderData: { recipes } } as Route.ComponentProps;
  return render(
    <MemoryRouter initialEntries={[url]}>
      <HomePage {...props} />
    </MemoryRouter>,
  );
};
/** The slugs of the cards on the page, in order. */
const shownTitles = () => screen.queryAllByTestId('RecipeCard-link').map((a) => a.getAttribute('href')?.replace('/recepten/', ''));
const chip = (name: string) => screen.getAllByTestId('FilterBar-chip').find((c) => c.textContent === name)!;
const sortInput = (value: string) => screen.getAllByTestId<HTMLInputElement>('FilterBar-sort').find((i) => i.value === value)!;
/** The "n recepten" line. */
const count = () => screen.getByTestId('HomePage-count').textContent;
const searchBox = () => screen.getByTestId<HTMLInputElement>('FilterBar-search');

// Runs first: the other tests add recipes to the shared database.
describe('recipe-browsing › No recipes yet', () => {
  test('the loader returns no recipes', async () => {
    assert.deepEqual(await load(), []);
  });

  test('the page shows the empty message', async () => {
    renderAt('/', await load());
    assert.ok(screen.getByTestId('HomePage-empty'));
  });

  test('the page links to adding a recipe', async () => {
    renderAt('/', await load());
    assert.equal(screen.getByTestId('HomePage-add').getAttribute('href'), '/recepten/nieuw');
  });

  test('the page offers no search or filter controls', async () => {
    const { container } = renderAt('/', await load());
    assert.equal(container.querySelector('output, input'), null);
  });
});

describe('recipe-browsing › Recipe without time or image', () => {
  const cardOf = async () => {
    const slug = await createRecipe(db, { title: 'Kaal', author: 'Oma' });
    return (await load()).find((r) => r.slug === slug);
  };

  test('the loader gives no time and no image', async () => {
    const card = await cardOf();
    assert.equal(card?.time, null);
    assert.equal(card?.image, null);
  });

  // The card leaves the time and the image out when there are none.
  test('the card shows the author without a time', async () => {
    renderAt('/', [(await cardOf())!]);
    const link = screen.getByTestId('RecipeCard-link');
    assert.equal(within(link).getByTestId('RecipeCard-author').textContent, 'van Oma');
    assert.ok(!link.textContent?.includes('·'));
  });

  test('the card shows no image', async () => {
    renderAt('/', [(await cardOf())!]);
    assert.equal(screen.getByTestId('RecipeCard-link').querySelector('img'), null);
  });
});

describe('recipe-browsing › Stored recipes are listed', () => {
  test('the newest recipes come first', async () => {
    const first = await createRecipe(db, { title: 'Eerste', author: 'Papa', time: '30 min', image: '/a.jpg' });
    const second = await createRecipe(db, { title: 'Tweede', author: 'Mama' });
    const slugs = (await load()).map((r) => r.slug);
    assert.deepEqual(slugs.slice(0, 2), [second, first]);
  });
});

describe('recipe-browsing › A new recipe appears', () => {
  const shownCount = async () => {
    const view = renderAt('/', await load());
    const n = /^(\d+) recept/.exec(count() ?? '')?.[1];
    view.unmount();
    return n;
  };

  test('the page counts the stored recipes', async () => {
    assert.equal(await shownCount(), String((await load()).length));
  });

  test('the loader lists the new recipe first', async () => {
    const listed = await load();
    const slug = await createRecipe(db, { title: 'Nieuw', author: 'Opa' });
    const relisted = await load();
    assert.equal(relisted.length, listed.length + 1);
    assert.equal(relisted[0]?.slug, slug);
  });

  test('the page count includes the new recipe', async () => {
    await createRecipe(db, { title: 'Nieuw', author: 'Opa' });
    assert.equal(await shownCount(), String((await load()).length));
  });
});

describe('recipe-browsing › Welcome above the recipes', () => {
  test('the title comes before the intro and the intro before the list', async () => {
    const { container } = renderAt('/', await load());
    const heading = screen.getByTestId('HomePage-title');
    const intro = screen.getByTestId('HomePage-intro');
    assert.ok(precedes(heading, intro) && precedes(intro, container.querySelector('ul')!));
  });
});

// Filtering runs in the browser over the loaded list, so these render the page for a given list and address.
const summary = (title: string, author: string): RecipeSummary => ({ slug: title.toLowerCase(), title, author, time: null, image: null, seal: null });
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
    const few = renderAt('/', family.slice(0, 3));
    assert.ok(searchBox());
    assert.equal(few.container.querySelector('[aria-pressed]'), null);
    assert.equal(screen.queryAllByTestId('FilterBar-sort').length, 0);
  });

  test('the chips are offered once there are more recipes', () => {
    assert.ok(renderAt('/', family).container.querySelector('[aria-pressed]'));
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
  beforeEach(() => {
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
    beforeEach(() => {
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
    beforeEach(() => {
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

  beforeEach(() => {
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
