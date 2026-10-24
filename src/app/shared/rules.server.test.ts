import assert from 'node:assert/strict';
import { describe } from 'vitest';
import { test } from '~testing/test';
import { defaultRules } from './rules';
import { getRules, resetRules, saveRules, toFields, type RulesFields } from './rules.server';

// Every test starts and ends on the defaults, so the order does not matter.
test.afterEach(({ db }) => resetRules(db));

const stored = (db: D1Database, value: string) =>
  db
    .prepare("INSERT INTO settings (key, value) VALUES ('parsing-rules', ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value")
    .bind(value)
    .run();
const edit = async (db: D1Database, change: Partial<RulesFields>) => {
  const { errors } = await saveRules(db, { ...toFields(await getRules(db)), ...change });
  return errors;
};
const rowCount = async (db: D1Database) => (await db.prepare("SELECT key FROM settings WHERE key = 'parsing-rules'").all()).results.length;

describe('parsing-rules › Default rules', () => {
  test('the stored rules are the defaults', async ({ db }) => {
    assert.deepEqual(await getRules(db), defaultRules);
  });
});

describe('parsing-rules › Unreadable saved rules', () => {
  // The schema refuses text that is not JSON, so "unreadable" is JSON of the wrong shape.
  for (const value of [
    '"text"',
    '{"units":"g"}',
    '{"spoken":{"x":0}}',
    'null',
    '[1]',
    '{"units":[]}',
    '{"degreeWords":[""]}',
    '{"spoken":{"x":99999999999999999999}}',
  ])
    test(`${value} gives the defaults`, async ({ db }) => {
      await stored(db, value);
      assert.deepEqual(await getRules(db), defaultRules);
    });

  test('a field an older value lacks takes its default', async ({ db }) => {
    await stored(db, '{"units":["g"]}');
    assert.deepEqual(await getRules(db), { ...defaultRules, units: ['g'] });
  });
});

describe('parsing-rules › Restore defaults', () => {
  test('a saved change is in the rules', async ({ db }) => {
    assert.equal(await edit(db, { units: 'g\nkopje' }), undefined);
    assert.ok((await getRules(db)).units.includes('kopje'));
  });

  test('restoring removes the stored row', async ({ db }) => {
    await edit(db, { units: 'g\nkopje' });
    await resetRules(db);
    assert.equal(await rowCount(db), 0);
  });

  test('restoring brings back the default units', async ({ db }) => {
    await edit(db, { units: 'g\nkopje' });
    await resetRules(db);
    assert.equal((await getRules(db)).units.includes('kopje'), false);
  });
});

describe('parsing-rules › Add a unit', () => {
  const add = async (db: D1Database) => {
    assert.equal(await edit(db, { units: toFields(defaultRules).units + '\nKopje\n\nkopje' }), undefined);
    return getRules(db);
  };

  test('is lowercased and the repeat dropped', async ({ db }) => {
    assert.equal((await add(db)).units.filter((u) => u === 'kopje').length, 1);
  });

  test('is what the page shows', async ({ db }) => {
    assert.equal(toFields(await add(db)).units.includes('kopje'), true);
  });
});

describe('parsing-rules › Remove a word', () => {
  test('the word is gone', async ({ db }) => {
    assert.equal(await edit(db, { minuteWords: 'minuten\nminuut' }), undefined);
    assert.deepEqual((await getRules(db)).minuteWords, ['minuten', 'minuut']);
  });
});

describe('parsing-rules › Spoken duration', () => {
  test('a new spoken duration is stored', async ({ db }) => {
    assert.equal(await edit(db, { spoken: toFields(defaultRules).spoken + '\ndrie kwartier = 45' }), undefined);
    assert.equal((await getRules(db)).spoken['drie kwartier'], 45);
  });
});

describe('parsing-rules › Spoken duration without minutes', () => {
  for (const line of [
    'een tijdje',
    'een tijdje = 0',
    'een tijdje = x',
    'een tijdje = 1,5',
    'een tijdje = 1441',
    'een tijdje = 999999999999999999999',
  ])
    test(`"${line}" is refused`, async ({ db }) => {
      const errors = await edit(db, { spoken: line });
      assert.match(errors?.spoken ?? '', /heel aantal minuten/);
    });

  test('nothing is stored', async ({ db }) => {
    await edit(db, { spoken: 'een tijdje' });
    assert.equal(await rowCount(db), 0);
  });
});

describe('parsing-rules › Empty list', () => {
  test('is refused', async ({ db }) => {
    const errors = await edit(db, { units: '\n  \n' });
    assert.match(errors?.units ?? '', /niet leeg/);
  });

  test('nothing is stored', async ({ db }) => {
    await edit(db, { units: '\n  \n' });
    assert.equal(await rowCount(db), 0);
  });
});

describe('parsing-rules › Word in two lists', () => {
  test('a minute word that is also an hour word is refused', async ({ db }) => {
    assert.match((await edit(db, { minuteWords: 'minuten\nu' }))?.hourWords ?? '', /lijst/);
  });

  test('a unit may not be a degree word either', async ({ db }) => {
    assert.match((await edit(db, { degreeWords: 'graden\ng' }))?.degreeWords ?? '', /één lijst/);
  });

  test('nothing is stored', async ({ db }) => {
    await edit(db, { minuteWords: 'minuten\nu' });
    await edit(db, { degreeWords: 'graden\ng' });
    assert.equal(await rowCount(db), 0);
  });
});

describe('parsing-rules › Saving the unchanged defaults succeeds', () => {
  test('there are no errors', async ({ db }) => {
    assert.equal(await saveRules(db, toFields(defaultRules)).then((r) => r.errors), undefined);
  });

  test('the rules are still the defaults', async ({ db }) => {
    await saveRules(db, toFields(defaultRules));
    assert.deepEqual(await getRules(db), defaultRules);
  });
});

describe('parsing-rules › Word with other characters', () => {
  test('a plus sign is refused', async ({ db }) => {
    const errors = await edit(db, { units: 'g\na+' });
    assert.match(errors?.units ?? '', /letters/);
  });

  // A unit is one word: no space or degree sign.
  test('a space is refused', async ({ db }) => {
    assert.match((await edit(db, { units: 'g\neetlepel vol' }))?.units ?? '', /letters/);
  });

  test('a degree sign is refused', async ({ db }) => {
    assert.match((await edit(db, { units: 'g\n°' }))?.units ?? '', /letters/);
  });

  test('nothing is stored', async ({ db }) => {
    await edit(db, { units: 'g\na+' });
    await edit(db, { units: 'g\neetlepel vol' });
    await edit(db, { units: 'g\n°' });
    assert.equal(await rowCount(db), 0);
  });
});
