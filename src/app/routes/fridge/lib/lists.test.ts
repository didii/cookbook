import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { addEntry, isFiltered, listParams, maxEntries, maxEntryLength, noLists, parseLists, removeEntry, type Lists } from './lists';

const lists = (change: Partial<Lists>): Lists => ({ ...noLists, ...change });

describe('fridge-search › A word moves to the other list', () => {
  test('it is in Liever niet and no longer in Heb ik', () => {
    assert.deepEqual(addEntry(lists({ heb: ['ui', 'kip'] }), 'zonder', 'ui'), lists({ heb: ['kip'], zonder: ['ui'] }));
  });

  test('the other way round too', () => {
    assert.deepEqual(addEntry(lists({ zonder: ['Ui'] }), 'heb', 'ui'), lists({ heb: ['ui'] }));
  });
});

describe('addEntry', () => {
  test('trims and makes runs of spaces one', () => {
    assert.deepEqual(addEntry(noLists, 'heb', '  rode   ui ').heb, ['rode ui']);
  });

  test('empty text changes nothing', () => {
    assert.equal(addEntry(noLists, 'heb', '  '), noLists);
  });

  test('a word already there, in another letter case, stays once', () => {
    assert.deepEqual(addEntry(lists({ heb: ['Kip'] }), 'heb', 'kip').heb, ['Kip']);
  });

  test('a new word comes last', () => {
    assert.deepEqual(addEntry(lists({ heb: ['kip'] }), 'heb', 'rijst').heb, ['kip', 'rijst']);
  });
});

describe('removeEntry', () => {
  test('takes the entry out of its list', () => {
    assert.deepEqual(removeEntry(lists({ heb: ['kip', 'rijst'] }), 'heb', 'kip').heb, ['rijst']);
  });
});

describe('fridge-search › Opening an address with lists', () => {
  test('the entries are in their lists', () => {
    const parsed = parseLists(new URLSearchParams('heb=kip&heb=rijst&zonder=spruitjes'));
    assert.deepEqual(parsed, lists({ heb: ['kip', 'rijst'], zonder: ['spruitjes'] }));
  });

  test('sort=az is the A–Z order', () => {
    assert.equal(parseLists(new URLSearchParams('sort=az')).sort, 'az');
  });

  test('an unknown order is the default', () => {
    assert.equal(parseLists(new URLSearchParams('sort=x')).sort, 'nieuwste');
  });

  test('empty and repeated entries are dropped', () => {
    assert.deepEqual(parseLists(new URLSearchParams('heb=&heb=Kip&heb=kip&heb=%20')).heb, ['Kip']);
  });

  test('a word in both lists stays in Liever niet only', () => {
    const parsed = parseLists(new URLSearchParams('heb=ui&heb=kip&zonder=ui'));
    assert.deepEqual([parsed.heb, parsed.zonder], [['kip'], ['ui']]);
  });
});

describe('parseLists limits', () => {
  test('only the first entries of a list are read', () => {
    const query = Array.from({ length: maxEntries + 20 }, (_, i) => 'heb=w' + i).join('&');
    assert.equal(parseLists(new URLSearchParams(query)).heb.length, maxEntries);
  });

  test('an entry that is too long is dropped', () => {
    assert.deepEqual(parseLists(new URLSearchParams({ heb: 'a'.repeat(maxEntryLength + 1) })).heb, []);
  });

  test('an entry of the longest length is kept', () => {
    assert.equal(parseLists(new URLSearchParams({ zonder: 'a'.repeat(maxEntryLength) })).zonder.length, 1);
  });
});

describe('listParams', () => {
  test('writes each entry once and the order only for A–Z', () => {
    assert.equal(listParams(lists({ heb: ['kip', 'rijst'], zonder: ['ui'], sort: 'az' })).toString(), 'heb=kip&heb=rijst&zonder=ui&sort=az');
  });

  test('the default lists have no parameters', () => {
    assert.equal(listParams(noLists).toString(), '');
  });

  test('parsing what was written gives the lists back', () => {
    const l = lists({ heb: ['rode ui'], zonder: ['spruitjes'], sort: 'az' });
    assert.deepEqual(parseLists(listParams(l)), l);
  });
});

describe('isFiltered', () => {
  test('is false for the default lists', () => {
    assert.equal(isFiltered(noLists), false);
  });

  test.each([{ heb: ['a'] }, { zonder: ['a'] }, { sort: 'az' as const }])('is true for %o', (change) => {
    assert.equal(isFiltered(lists(change)), true);
  });
});
