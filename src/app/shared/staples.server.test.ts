import assert from 'node:assert/strict';
import { describe } from 'vitest';
import { test } from '~testing/test';
import { defaultStaples } from './staples';
import { getStaples, maxStapleLength, maxStaples, readStaples, resetStaples, saveStaples } from './staples.server';

const stored = (db: D1Database, value: string) =>
  db.prepare("INSERT INTO settings (key, value) VALUES ('staples', ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value").bind(value).run();
const saved = (input: string[]) => {
  const read = readStaples(input);
  assert.ok('staples' in read);
  return read.staples;
};
const refused = (input: string[]) => {
  const read = readStaples(input);
  assert.ok('errors' in read);
  return read.errors;
};

describe('staple-management › Default staples', () => {
  test('the staples in use are the defaults', async ({ db }) => {
    assert.deepEqual(await getStaples(db), ['zout', 'peper', 'water', 'olie', 'boter', 'suiker']);
    assert.deepEqual(defaultStaples, ['zout', 'peper', 'water', 'olie', 'boter', 'suiker']);
  });

  test('restoring removes the saved list', async ({ db }) => {
    await saveStaples(db, ['meel']);
    await resetStaples(db);
    assert.deepEqual(await getStaples(db), defaultStaples);
  });
});

describe('staple-management › Unreadable list', () => {
  for (const value of ['"text"', '{"a":1}', 'null', '[1]', '["zout!"]', `["${'a'.repeat(maxStapleLength + 1)}"]`])
    test(`${value} gives the defaults`, async ({ db }) => {
      await stored(db, value);
      assert.deepEqual(await getStaples(db), defaultStaples);
    });
});

describe('staple-management › A saved list replaces the defaults', () => {
  test('exactly the saved staples are in use', async ({ db }) => {
    await saveStaples(db, saved(['zout', 'meel']));
    assert.deepEqual(await getStaples(db), ['zout', 'meel']);
  });
});

describe('staple-management › A saved empty list means no staples', () => {
  test('no staples are in use', async ({ db }) => {
    await saveStaples(db, saved([]));
    assert.deepEqual(await getStaples(db), []);
  });
});

describe('staple-management › Repeated staple', () => {
  test('the staples include the word once', () => {
    assert.deepEqual(saved(['Zout', 'zout']), ['Zout']);
  });

  test('accents are ignored', () => {
    assert.deepEqual(saved(['crème', 'creme']), ['crème']);
  });

  test('empty rows are dropped and spaces made one', () => {
    assert.deepEqual(saved(['', '  rode   wijn ']), ['rode wijn']);
  });
});

describe('staple-management › Other characters', () => {
  test('the row says the word may only hold letters and spaces', () => {
    const errors = refused(['zout', 'zout!']);
    assert.equal(typeof errors.rows?.[1], 'string');
    assert.equal(errors.rows?.[0], undefined);
  });
});

describe('staple-management › Too long a word', () => {
  test('the row says the word is too long', () => {
    assert.equal(typeof refused(['a'.repeat(maxStapleLength + 1)]).rows?.[0], 'string');
  });

  test('a word of the maximum length is accepted', () => {
    assert.equal(saved(['a'.repeat(maxStapleLength)]).length, 1);
  });
});

describe('staple-management › Too many staples', () => {
  const many = (n: number) =>
    Array.from({ length: n }, (_, i) => `woord ${'abcdefghij'[i % 10]}${'klmnopqrst'[Math.floor(i / 10) % 10]}${'uvwxyzabcd'[Math.floor(i / 100)]}`);

  test('the list says there are too many', () => {
    assert.equal(typeof refused(many(maxStaples + 1)).list, 'string');
  });

  test('the maximum is accepted', () => {
    assert.equal(saved(many(maxStaples)).length, maxStaples);
  });
});
