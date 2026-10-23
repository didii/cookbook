import assert from 'node:assert/strict';
import { afterAll, afterEach, beforeAll, describe, test } from 'vitest';
import { createTestDb } from '~testing/db';
import { parseIngredient } from './ingredients';
import { defaultRules } from './rules';
import { getRules, resetRules, saveRules, toFields, type RulesFields } from './rules.server';
import { findOven, findTimer } from './stepParsers';

let db: D1Database;
let dispose: () => Promise<void>;

beforeAll(async () => {
  ({ db, dispose } = await createTestDb());
});

afterAll(() => dispose());

// Every test starts and ends on the defaults, so the order does not matter.
afterEach(() => resetRules(db));

const stored = (value: string) =>
  db
    .prepare("INSERT INTO settings (key, value) VALUES ('parsing-rules', ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value")
    .bind(value)
    .run();
const edit = async (change: Partial<RulesFields>) => {
  const { errors } = await saveRules(db, { ...toFields(await getRules(db)), ...change });
  return errors;
};
const rowCount = async () => (await db.prepare("SELECT key FROM settings WHERE key = 'parsing-rules'").all()).results.length;

describe('parsing-rules › Default rules', () => {
  test('the stored rules are the defaults', async () => {
    assert.deepEqual(await getRules(db), defaultRules);
  });

  test('a timer in minutes is found', async () => {
    assert.equal(findTimer('30 minuten', await getRules(db))?.values.minutes, 30);
  });

  test('a timer in decimal hours is found', async () => {
    assert.equal(findTimer('1,5 uur', await getRules(db))?.values.minutes, 90);
  });

  test('a spoken timer is found', async () => {
    assert.equal(findTimer('een kwartier', await getRules(db))?.values.minutes, 15);
  });

  test('an oven temperature is found', async () => {
    assert.equal(findOven('180 graden', await getRules(db))?.values.degrees, 180);
  });

  test('an ingredient unit is found', async () => {
    assert.equal(parseIngredient('250 g bloem', await getRules(db)).unit, 'g');
  });
});

describe('parsing-rules › Degree words include the degree sign', () => {
  for (const text of ['180°', '180 °C', '180 graden'])
    test(`${text} is 180 degrees`, () => {
      assert.equal(findOven(text, defaultRules)?.values.degrees, 180);
    });
});

describe('parsing-rules › Grams are not degrees', () => {
  test('180 gr is no oven temperature', () => {
    assert.equal(findOven('180 gr', defaultRules), undefined);
  });

  test('180 gr bloem has the unit gr', () => {
    assert.equal(parseIngredient('180 gr bloem', defaultRules).unit, 'gr');
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
    test(`${value} gives the defaults`, async () => {
      await stored(value);
      assert.deepEqual(await getRules(db), defaultRules);
    });

  test('a field an older value lacks takes its default', async () => {
    await stored('{"units":["g"]}');
    assert.deepEqual(await getRules(db), { ...defaultRules, units: ['g'] });
  });
});

describe('parsing-rules › Restore defaults', () => {
  test('a saved change is in the rules', async () => {
    assert.equal(await edit({ units: 'g\nkopje' }), undefined);
    assert.ok((await getRules(db)).units.includes('kopje'));
  });

  test('restoring removes the stored row', async () => {
    await edit({ units: 'g\nkopje' });
    await resetRules(db);
    assert.equal(await rowCount(), 0);
  });

  test('restoring brings back the default units', async () => {
    await edit({ units: 'g\nkopje' });
    await resetRules(db);
    assert.equal((await getRules(db)).units.includes('kopje'), false);
  });
});

describe('parsing-rules › Add a unit', () => {
  const add = async () => {
    assert.equal(await edit({ units: toFields(defaultRules).units + '\nKopje\n\nkopje' }), undefined);
    return getRules(db);
  };

  test('is lowercased and the repeat dropped', async () => {
    assert.equal((await add()).units.filter((u) => u === 'kopje').length, 1);
  });

  test('is what the page shows', async () => {
    assert.equal(toFields(await add()).units.includes('kopje'), true);
  });
});

describe('parsing-rules › Remove a word', () => {
  test('the word is gone', async () => {
    assert.equal(await edit({ minuteWords: 'minuten\nminuut' }), undefined);
    assert.deepEqual((await getRules(db)).minuteWords, ['minuten', 'minuut']);
  });
});

describe('parsing-rules › Spoken duration', () => {
  test('a new spoken duration is stored', async () => {
    assert.equal(await edit({ spoken: toFields(defaultRules).spoken + '\ndrie kwartier = 45' }), undefined);
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
    test(`"${line}" is refused`, async () => {
      const errors = await edit({ spoken: line });
      assert.match(errors?.spoken ?? '', /heel aantal minuten/);
    });

  test('nothing is stored', async () => {
    await edit({ spoken: 'een tijdje' });
    assert.equal(await rowCount(), 0);
  });
});

describe('parsing-rules › Empty list', () => {
  test('is refused', async () => {
    const errors = await edit({ units: '\n  \n' });
    assert.match(errors?.units ?? '', /niet leeg/);
  });

  test('nothing is stored', async () => {
    await edit({ units: '\n  \n' });
    assert.equal(await rowCount(), 0);
  });
});

describe('parsing-rules › Word in two lists', () => {
  test('a minute word that is also an hour word is refused', async () => {
    assert.match((await edit({ minuteWords: 'minuten\nu' }))?.hourWords ?? '', /lijst/);
  });

  test('a unit may not be a degree word either', async () => {
    assert.match((await edit({ degreeWords: 'graden\ng' }))?.degreeWords ?? '', /één lijst/);
  });

  test('nothing is stored', async () => {
    await edit({ minuteWords: 'minuten\nu' });
    await edit({ degreeWords: 'graden\ng' });
    assert.equal(await rowCount(), 0);
  });
});

describe('parsing-rules › Saving the unchanged defaults succeeds', () => {
  test('there are no errors', async () => {
    assert.equal(await saveRules(db, toFields(defaultRules)).then((r) => r.errors), undefined);
  });

  test('the rules are still the defaults', async () => {
    await saveRules(db, toFields(defaultRules));
    assert.deepEqual(await getRules(db), defaultRules);
  });
});

describe('parsing-rules › Word with other characters', () => {
  test('a plus sign is refused', async () => {
    const errors = await edit({ units: 'g\na+' });
    assert.match(errors?.units ?? '', /letters/);
  });

  // A unit is one word: no space or degree sign.
  test('a space is refused', async () => {
    assert.match((await edit({ units: 'g\neetlepel vol' }))?.units ?? '', /letters/);
  });

  test('a degree sign is refused', async () => {
    assert.match((await edit({ units: 'g\n°' }))?.units ?? '', /letters/);
  });

  test('nothing is stored', async () => {
    await edit({ units: 'g\na+' });
    await edit({ units: 'g\neetlepel vol' });
    await edit({ units: 'g\n°' });
    assert.equal(await rowCount(), 0);
  });
});

// Recognition follows the rules.
const withRules = (change: Partial<typeof defaultRules>) => ({ ...defaultRules, ...change });

describe('parsing-rules › Words are not regular expressions', () => {
  const rules = withRules({ minuteWords: ['m+'] });

  test('the word m+ matches literally', () => {
    assert.equal(findTimer('20 m+', rules)?.values.minutes, 20);
  });

  test('the word m+ does not match mmm', () => {
    assert.equal(findTimer('20 mmm', rules), undefined);
  });
});

describe('parsing-rules › New unit is recognised', () => {
  test('the unit and name are split', () => {
    const parsed = parseIngredient('2 kopje rijst', withRules({ units: [...defaultRules.units, 'kopje'] }));
    assert.deepEqual([parsed.unit, parsed.name], ['kopje', 'rijst']);
  });
});

describe('parsing-rules › New minute word makes a timer', () => {
  const rules = withRules({ minuteWords: [...defaultRules.minuteWords, 'mins'] });

  test('the new rules find the timer', () => {
    assert.equal(findTimer('Bak 20 mins', rules)?.values.minutes, 20);
  });

  test('the default rules do not', () => {
    assert.equal(findTimer('Bak 20 mins', defaultRules), undefined);
  });
});

describe('parsing-rules › New spoken duration makes a timer', () => {
  test('the new spoken duration is found', () => {
    const rules = withRules({ spoken: { ...defaultRules.spoken, 'drie kwartier': 45 } });
    assert.equal(findTimer('Bak drie kwartier', rules)?.values.minutes, 45);
  });
});

describe('parsing-rules › Removed word is not recognised', () => {
  const rules = withRules({ degreeWords: ['°c', '°'] });

  test('the removed word is not found', () => {
    assert.equal(findOven('180 graden', rules), undefined);
  });

  test('the remaining words still are', () => {
    assert.equal(findOven('180 °C', rules)?.values.degrees, 180);
  });
});
