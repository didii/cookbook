import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import type { ManagedTag } from '~app/shared/tags';
import { arrangeTags, type TagFilters } from './arrangeTags';

const tag = (name: string, category: string | null = null, uses = 1): ManagedTag => ({ name, category, uses });
const filters: TagFilters = { q: '', unused: false, withoutCategory: false, order: 'name' };
const names = (list: ManagedTag[], f: Partial<TagFilters> = {}) =>
  arrangeTags(list, { ...filters, ...f })
    .flatMap((g) => g.tags)
    .map((t) => t.name);

describe('tag-management › Sorted by name', () => {
  test('letter case is ignored', () => {
    assert.deepEqual(names([tag('winter'), tag('Soep'), tag('Bakken')]), ['Bakken', 'Soep', 'winter']);
  });

  test('there is one group', () => {
    assert.equal(arrangeTags([tag('Soep', 'Gerecht'), tag('Snel')], filters).length, 1);
  });
});

describe('tag-management › Sorted by category', () => {
  test('groups are alphabetical, tags without a category come last, tags inside are alphabetical', () => {
    const groups = arrangeTags([tag('Soep', 'Gerecht'), tag('Snel'), tag('Winter', 'Seizoen'), tag('Bakken', 'Gerecht')], {
      ...filters,
      order: 'category',
    });
    assert.deepEqual(
      groups.map((g) => [g.category, g.tags.map((t) => t.name)]),
      [
        ['Gerecht', ['Bakken', 'Soep']],
        ['Seizoen', ['Winter']],
        [null, ['Snel']],
      ],
    );
  });
});

describe('tag-management › Name filter', () => {
  test('matches any part of the name, letter case ignored', () => {
    assert.deepEqual(names([tag('Soep'), tag('Soepen'), tag('Winter'), tag('Groentesoep')], { q: 'soep' }), ['Groentesoep', 'Soep', 'Soepen']);
  });
});

describe('tag-management › Unused filter', () => {
  test('only tags on no recipe', () => {
    assert.deepEqual(names([tag('Soep', null, 3), tag('Kerst', null, 0)], { unused: true }), ['Kerst']);
  });
});

describe('tag-management › Without category filter', () => {
  test('only tags without a category', () => {
    assert.deepEqual(names([tag('Soep', 'Gerecht'), tag('Snel')], { withoutCategory: true }), ['Snel']);
  });
});

describe('tag-management › Filters combine', () => {
  test('name and unused both apply', () => {
    const list = [tag('Kerst', null, 0), tag('Kerstmis', null, 0), tag('Kerstdiner', null, 2), tag('Soep', null, 0)];
    assert.deepEqual(names(list, { q: 'kerst', unused: true }), ['Kerst', 'Kerstmis']);
  });

  test('all three apply', () => {
    const list = [tag('Kerst', 'Gelegenheid', 0), tag('Kerstmis', null, 0), tag('Kerstdiner', null, 2)];
    assert.deepEqual(names(list, { q: 'kerst', unused: true, withoutCategory: true }), ['Kerstmis']);
  });
});

describe('arrangeTags', () => {
  test('nothing left gives no groups, in either order', () => {
    assert.deepEqual(arrangeTags([tag('Soep')], { ...filters, q: 'x', order: 'category' }), []);
    assert.deepEqual(arrangeTags([], filters), []);
  });
});
