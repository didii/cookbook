import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { activeFilterCount, authorsOf, filterParams, filterRecipes, isFiltered, parseFilters, type Filters } from './filterRecipes';

const none: Filters = {};
const recipes = [
  { title: 'Erwtensoep', author: 'Papa' },
  { title: 'Appeltaart', author: 'Oma' },
  { title: 'Crème brûlée', author: 'oma' },
  { title: 'Stoofvlees', author: 'Papa' },
  { title: 'Èclair', author: 'Mama' },
];
const titles = (list: { title: string }[]) => list.map((r) => r.title);

describe('recipe-filtering › Searching by title', () => {
  test('finds the matching title', () => {
    assert.deepEqual(titles(filterRecipes(recipes, { q: 'appel' })), ['Appeltaart']);
  });
});

describe('recipe-filtering › Searching by author', () => {
  test('finds the matching author', () => {
    assert.deepEqual(titles(filterRecipes(recipes, { q: 'mama' })), ['Èclair']);
  });

  test('finds every recipe of an author whatever the case', () => {
    assert.deepEqual(titles(filterRecipes(recipes, { q: 'oma' })), ['Appeltaart', 'Crème brûlée']);
  });
});

describe('search', () => {
  test('ignores case and surrounding spaces', () => {
    assert.deepEqual(titles(filterRecipes(recipes, { q: ' CREME BRULEE ' })), ['Crème brûlée']);
  });

  test('a blank search matches everything', () => {
    assert.equal(filterRecipes(recipes, { q: '   ' }).length, recipes.length);
  });

  test('ignores accents in the search', () => {
    assert.deepEqual(titles(filterRecipes(recipes, { q: 'eclair' })), ['Èclair']);
  });

  test('matches accents in the title', () => {
    assert.deepEqual(titles(filterRecipes(recipes, { q: 'crème' })), ['Crème brûlée']);
  });
});

describe('recipe-filtering › Clearing the search', () => {
  const narrowed = { author: 'Papa' };

  test('with a search only the matches of the author remain', () => {
    assert.deepEqual(titles(filterRecipes(recipes, { ...narrowed, q: 'soep' })), ['Erwtensoep']);
  });

  test('without a search all recipes of the author remain', () => {
    assert.deepEqual(titles(filterRecipes(recipes, { ...narrowed, q: '' })), ['Erwtensoep', 'Stoofvlees']);
  });
});

describe('recipe-filtering › Choosing an author', () => {
  test('lists the recipes of the author', () => {
    assert.deepEqual(titles(filterRecipes(recipes, { author: 'Papa' })), ['Erwtensoep', 'Stoofvlees']);
  });

  // Case variants are one author.
  test('treats case variants as one author', () => {
    assert.deepEqual(titles(filterRecipes(recipes, { author: 'Oma' })), ['Appeltaart', 'Crème brûlée']);
  });
});

describe('recipe-filtering › Search and author combine', () => {
  test('both must match', () => {
    assert.deepEqual(titles(filterRecipes(recipes, { author: 'Papa', q: 'stoof' })), ['Stoofvlees']);
  });

  test('a search that no recipe of the author matches finds nothing', () => {
    assert.deepEqual(filterRecipes(recipes, { author: 'Papa', q: 'appel' }), []);
  });
});

describe('recipe-filtering › Default order', () => {
  // The list arrives newest first and "Nieuwste" keeps it.
  test('keeps the order of the list', () => {
    assert.deepEqual(titles(filterRecipes(recipes, none)), titles(recipes));
  });

  test('the default sort is nieuwste', () => {
    assert.equal(parseFilters(new URLSearchParams()).sort, 'nieuwste');
  });
});

describe('recipe-filtering › Sorting alphabetically', () => {
  test('orders by title, ignoring accents', () => {
    assert.deepEqual(titles(filterRecipes(recipes, { sort: 'az' })), ['Appeltaart', 'Crème brûlée', 'Èclair', 'Erwtensoep', 'Stoofvlees']);
  });
});

describe('filterRecipes', () => {
  test('sorting does not reorder the list it was given', () => {
    const before = titles(recipes);
    filterRecipes(recipes, { sort: 'az' });
    assert.deepEqual(titles(recipes), before);
  });
});

describe('authorsOf', () => {
  test('lists authors once, first spelling wins, alphabetical', () => {
    assert.deepEqual(authorsOf(recipes), ['Mama', 'Oma', 'Papa']);
  });

  test('lists nothing for no recipes', () => {
    assert.deepEqual(authorsOf([]), []);
  });
});

describe('activeFilterCount', () => {
  test('is zero without filters', () => {
    assert.equal(activeFilterCount(none), 0);
  });

  test('does not count the search text', () => {
    assert.equal(activeFilterCount({ q: 'x' }), 0);
  });

  test('counts author and order', () => {
    assert.equal(activeFilterCount({ author: 'Oma', sort: 'az' }), 2);
  });

  test('counts the order alone', () => {
    assert.equal(activeFilterCount({ sort: 'az' }), 1);
  });
});

describe('isFiltered', () => {
  test('is false without filters', () => {
    assert.equal(isFiltered(none), false);
  });

  test('is false for a blank search', () => {
    assert.equal(isFiltered({ q: '  ' }), false);
  });

  test('is true for a search', () => {
    assert.equal(isFiltered({ q: 'a' }), true);
  });

  test('is true for an author', () => {
    assert.equal(isFiltered({ author: 'Oma' }), true);
  });

  test('is true for a non-default order', () => {
    assert.equal(isFiltered({ sort: 'az' }), true);
  });
});

describe('parseFilters', () => {
  test('reads the address', () => {
    assert.deepEqual(parseFilters(new URLSearchParams('q=appel&auteur=Oma&sort=az')), { q: 'appel', author: 'Oma', sort: 'az' });
  });

  test('falls back to defaults', () => {
    assert.deepEqual(parseFilters(new URLSearchParams('sort=bogus&auteur=')), { q: '', author: undefined, sort: 'nieuwste' });
  });
});

describe('filterParams', () => {
  test('leaves out defaults', () => {
    assert.equal(filterParams(none).toString(), '');
  });

  test('round-trips through parseFilters', () => {
    const f: Filters = { q: 'crème brûlée', author: 'Tante An', sort: 'az' };
    assert.deepEqual(parseFilters(new URLSearchParams(filterParams(f).toString())), f);
  });

  test('writes a non-default order', () => {
    assert.equal(filterParams({ sort: 'az' }).toString(), 'sort=az');
  });
});
