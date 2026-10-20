import assert from 'node:assert/strict';
import { test } from 'node:test';
import { activeFilterCount, authorsOf, filterParams, filterRecipes, isFiltered, parseFilters, type Filters } from './filterRecipes';

const none: Filters = { q: '', author: null, sort: 'nieuwste' };
const recipes = [
  { title: 'Erwtensoep', author: 'Papa' },
  { title: 'Appeltaart', author: 'Oma' },
  { title: 'Crème brûlée', author: 'oma' },
  { title: 'Stoofvlees', author: 'Papa' },
  { title: 'Èclair', author: 'Mama' },
];
const titles = (list: { title: string }[]) => list.map((r) => r.title);

test('recipe-filtering › Searching by title', () => {
  assert.deepEqual(titles(filterRecipes(recipes, { ...none, q: 'appel' })), ['Appeltaart']);
});

test('recipe-filtering › Searching by author', () => {
  assert.deepEqual(titles(filterRecipes(recipes, { ...none, q: 'mama' })), ['Èclair']);
  assert.deepEqual(titles(filterRecipes(recipes, { ...none, q: 'oma' })), ['Appeltaart', 'Crème brûlée']);
});

test('search ignores case, accents and surrounding spaces', () => {
  assert.deepEqual(titles(filterRecipes(recipes, { ...none, q: ' CREME BRULEE ' })), ['Crème brûlée']);
  assert.deepEqual(titles(filterRecipes(recipes, { ...none, q: 'eclair' })), ['Èclair']);
  assert.deepEqual(titles(filterRecipes(recipes, { ...none, q: 'crème' })), ['Crème brûlée']);
});

test('recipe-filtering › Clearing the search', () => {
  const narrowed = { ...none, author: 'Papa' };
  assert.deepEqual(titles(filterRecipes(recipes, { ...narrowed, q: 'soep' })), ['Erwtensoep']);
  assert.deepEqual(titles(filterRecipes(recipes, { ...narrowed, q: '' })), ['Erwtensoep', 'Stoofvlees']);
  assert.equal(filterRecipes(recipes, { ...none, q: '   ' }).length, recipes.length);
});

test('recipe-filtering › Choosing an author', () => {
  assert.deepEqual(titles(filterRecipes(recipes, { ...none, author: 'Papa' })), ['Erwtensoep', 'Stoofvlees']);
  // Case variants are one author.
  assert.deepEqual(titles(filterRecipes(recipes, { ...none, author: 'Oma' })), ['Appeltaart', 'Crème brûlée']);
});

test('recipe-filtering › Search and author combine', () => {
  assert.deepEqual(titles(filterRecipes(recipes, { ...none, author: 'Papa', q: 'stoof' })), ['Stoofvlees']);
  assert.deepEqual(filterRecipes(recipes, { ...none, author: 'Papa', q: 'appel' }), []);
});

test('recipe-filtering › Default order', () => {
  // The list arrives newest first and "Nieuwste" keeps it.
  assert.deepEqual(titles(filterRecipes(recipes, none)), titles(recipes));
  assert.equal(parseFilters(new URLSearchParams()).sort, 'nieuwste');
});

test('recipe-filtering › Sorting alphabetically', () => {
  assert.deepEqual(titles(filterRecipes(recipes, { ...none, sort: 'az' })), ['Appeltaart', 'Crème brûlée', 'Èclair', 'Erwtensoep', 'Stoofvlees']);
});

test('sorting does not reorder the list it was given', () => {
  const before = titles(recipes);
  filterRecipes(recipes, { ...none, sort: 'az' });
  assert.deepEqual(titles(recipes), before);
});

test('authors are listed once, first spelling wins, alphabetical', () => {
  assert.deepEqual(authorsOf(recipes), ['Mama', 'Oma', 'Papa']);
  assert.deepEqual(authorsOf([]), []);
});

test('active filters are counted for author and order, not for the search text', () => {
  assert.equal(activeFilterCount(none), 0);
  assert.equal(activeFilterCount({ q: 'x', author: null, sort: 'nieuwste' }), 0);
  assert.equal(activeFilterCount({ q: '', author: 'Oma', sort: 'az' }), 2);
  assert.equal(activeFilterCount({ q: '', author: null, sort: 'az' }), 1);
});

test('isFiltered is true for any narrowing or non-default order, not for blank search', () => {
  assert.equal(isFiltered(none), false);
  assert.equal(isFiltered({ ...none, q: '  ' }), false);
  assert.equal(isFiltered({ ...none, q: 'a' }), true);
  assert.equal(isFiltered({ ...none, author: 'Oma' }), true);
  assert.equal(isFiltered({ ...none, sort: 'az' }), true);
});

test('parseFilters reads the address and falls back to defaults', () => {
  assert.deepEqual(parseFilters(new URLSearchParams('q=appel&auteur=Oma&sort=az')), { q: 'appel', author: 'Oma', sort: 'az' });
  assert.deepEqual(parseFilters(new URLSearchParams('sort=bogus&auteur=')), none);
});

test('filterParams leaves out defaults and round-trips through parseFilters', () => {
  assert.equal(filterParams(none).toString(), '');
  const f: Filters = { q: 'crème brûlée', author: 'Tante An', sort: 'az' };
  assert.deepEqual(parseFilters(new URLSearchParams(filterParams(f).toString())), f);
  assert.equal(filterParams({ ...none, sort: 'az' }).toString(), 'sort=az');
});
