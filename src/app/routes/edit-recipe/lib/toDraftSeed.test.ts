import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { emptyDraftSeed } from './draft';
import type { ImportedRecipe } from './import/readRecipe';
import { formatTime, servingsFrom, toDraftSeed } from './toDraftSeed';

const address = 'https://example.com/soep';
const base = { ...emptyDraftSeed, author: 'Mam', tags: ['Soep'] };
const full: ImportedRecipe = {
  title: 'Tomatensoep',
  intro: 'Lekker.',
  servingsText: '4 porties',
  minutes: 80,
  ingredients: ['500 g tomaten', '1 ui'],
  steps: ['Snijd de ui.', 'Kook 20 minuten.'],
  image: 'https://example.com/a.jpg',
};
const map = (imported: Partial<ImportedRecipe> = {}) => toDraftSeed({ ...full, ...imported }, address, base);

describe('recipe-import › Source is the imported address', () => {
  test('the source field holds the address', () => {
    assert.equal(map().seed.source, address);
  });
});

describe('recipe-import › Author is not imported', () => {
  test('the author and tags are the ones of the starting seed', () => {
    const { seed } = map();
    assert.equal(seed.author, 'Mam');
    assert.deepEqual(seed.tags, ['Soep']);
  });
});

describe('recipe-import › Servings are read from text', () => {
  for (const [text, expected] of [
    ['4 porties', '4'],
    ['Serves 6-8', '6'],
    ['12', '12'],
    ['4.5 personen', '4'],
    ['een paar', ''],
    ['', ''],
    ['0 porties', ''],
    ['1000 porties', ''],
  ]) {
    test(`"${text}" gives "${expected}"`, () => {
      assert.equal(servingsFrom(text), expected);
      assert.equal(map({ servingsText: text }).seed.servings, expected);
    });
  }
});

describe('recipe-import › Partly filled recipe', () => {
  const { seed, imageUrl } = map({ intro: '', servingsText: '', minutes: undefined, ingredients: [], steps: [], image: undefined });

  test('missing text fields stay empty', () => {
    assert.deepEqual([seed.intro, seed.servings, seed.time], ['', '', '']);
  });

  test('missing lists stay empty', () => {
    assert.deepEqual([seed.ingredients, seed.steps], [[], []]);
  });

  test('a missing image gives no image address', () => {
    assert.equal(imageUrl, undefined);
  });

  test('what was found is filled in', () => {
    assert.equal(seed.title, 'Tomatensoep');
  });
});

describe('toDraftSeed', () => {
  test('maps the text fields', () => {
    const { seed } = map();
    assert.deepEqual([seed.title, seed.intro, seed.time], ['Tomatensoep', 'Lekker.', '1u 20']);
  });

  test('ingredients stay plain lines', () => {
    assert.deepEqual(map().seed.ingredients, ['500 g tomaten', '1 ui']);
  });

  test('steps carry only their text, so the editor proposes the chips', () => {
    assert.deepEqual(map().seed.steps, [
      { body: 'Snijd de ui.', ingredients: [] },
      { body: 'Kook 20 minuten.', ingredients: [] },
    ]);
  });

  test('the photo field stays empty and the image address is returned', () => {
    const { seed, imageUrl } = map();
    assert.equal(seed.image, '');
    assert.equal(imageUrl, 'https://example.com/a.jpg');
  });
});

describe('formatTime', () => {
  for (const [minutes, expected] of [
    [30, '30 min'],
    [45, '45 min'],
    [60, '1u 00'],
    [80, '1u 20'],
    [180, '3u 00'],
    [0, ''],
    [undefined, ''],
  ] as const) {
    test(`${minutes} gives "${expected}"`, () => {
      assert.equal(formatTime(minutes), expected);
    });
  }
});
