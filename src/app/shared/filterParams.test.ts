import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { filterParams, type Filters } from './filterParams';

const none: Filters = {};

describe('filterParams', () => {
  test('leaves out defaults', () => {
    assert.equal(filterParams(none).toString(), '');
  });

  test('writes the search text as q', () => {
    assert.equal(filterParams({ q: 'appel' }).toString(), 'q=appel');
  });

  test('writes one auteur per author', () => {
    assert.equal(filterParams({ authors: ['Oma', 'Papa'] }).toString(), 'auteur=Oma&auteur=Papa');
  });

  test('writes one tag per tag', () => {
    assert.equal(filterParams({ tags: ['Soep', 'Vlees'] }).toString(), 'tag=Soep&tag=Vlees');
  });

  test('writes a non-default order', () => {
    assert.equal(filterParams({ sort: 'az' }).toString(), 'sort=az');
  });
});
