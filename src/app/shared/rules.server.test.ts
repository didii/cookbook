import assert from 'node:assert/strict';
import { describe } from 'vitest';
import { test } from '~testing/test';
import { defaultRules } from './rules';
import { getRules, resetRules, saveRules, toRows, type RulesRows } from './rules.server';

const stored = (db: D1Database, value: string) =>
  db
    .prepare("INSERT INTO settings (key, value) VALUES ('parsing-rules', ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value")
    .bind(value)
    .run();
const edit = async (db: D1Database, change: Partial<RulesRows>) => {
  const { errors } = await saveRules(db, { ...toRows(await getRules(db)), ...change });
  return errors;
};
type Duration = RulesRows['durations'][number];
/** The default duration rows with some more. */
const withDurations = (...more: Duration[]) => ({ durations: [...toRows(defaultRules).durations, ...more] });
const rowCount = async (db: D1Database) => (await db.prepare("SELECT key FROM settings WHERE key = 'parsing-rules'").all()).results.length;

describe('parsing-rules › Default rules', () => {
  test('the stored rules are the defaults', async ({ db }) => {
    assert.deepEqual(await getRules(db), defaultRules);
  });

  test('the defaults hold the words that were hard-coded', () => {
    assert.deepEqual(defaultRules.perNumber, { minuten: 1, minuut: 1, min: 1, uren: 60, uur: 60, u: 60 });
    assert.equal(defaultRules.fixed['een kwartier'], 15);
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
    '{"looseUnits":"snuf"}',
    '{"looseUnits":["een druppel"]}',
    '{"perNumber":{}}',
    '{"perNumber":{"uur":0}}',
    '{"fixed":{"x":1441}}',
    '{"minuteWords":[]}',
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

describe('parsing-rules › Rules saved before duration rows', () => {
  const old = '{"minuteWords":["minuten"],"hourWords":["uur"],"spoken":{"een kwartier":15}}';

  test('minute and hour words get their minutes per number', async ({ db }) => {
    await stored(db, old);
    assert.deepEqual((await getRules(db)).perNumber, { minuten: 1, uur: 60 });
  });

  test('spoken durations are fixed durations', async ({ db }) => {
    await stored(db, old);
    assert.deepEqual((await getRules(db)).fixed, { 'een kwartier': 15 });
  });

  test('new keys win over old ones', async ({ db }) => {
    await stored(db, '{"minuteWords":["minuten"],"perNumber":{"dag":1440}}');
    assert.deepEqual((await getRules(db)).perNumber, { dag: 1440 });
  });

  test('an old list that is missing takes its default words', async ({ db }) => {
    await stored(db, '{"minuteWords":["mins"]}');
    assert.deepEqual((await getRules(db)).perNumber, { mins: 1, uren: 60, uur: 60, u: 60 });
  });
});

describe('parsing-rules › Restore defaults', () => {
  test('a saved change is in the rules', async ({ db }) => {
    assert.equal(await edit(db, { units: ['g', 'kopje'] }), undefined);
    assert.ok((await getRules(db)).units.includes('kopje'));
  });

  test('restoring removes the stored row', async ({ db }) => {
    await edit(db, { units: ['g', 'kopje'] });
    await resetRules(db);
    assert.equal(await rowCount(db), 0);
  });

  test('restoring brings back the default units', async ({ db }) => {
    await edit(db, { units: ['g', 'kopje'] });
    await resetRules(db);
    assert.equal((await getRules(db)).units.includes('kopje'), false);
  });
});

describe('parsing-rules › Add a unit', () => {
  const add = async (db: D1Database) => {
    assert.equal(await edit(db, { units: [...defaultRules.units, 'Kopje', '', 'kopje'] }), undefined);
    return getRules(db);
  };

  test('is lowercased and the repeat dropped', async ({ db }) => {
    assert.equal((await add(db)).units.filter((u) => u === 'kopje').length, 1);
  });

  test('is what the page shows', async ({ db }) => {
    assert.equal(toRows(await add(db)).units.includes('kopje'), true);
  });
});

describe('parsing-rules › Remove a word', () => {
  test('the word is gone', async ({ db }) => {
    const rows = toRows(defaultRules).durations.filter((d) => d.word !== 'min');
    assert.equal(await edit(db, { durations: rows }), undefined);
    assert.equal('min' in (await getRules(db)).perNumber, false);
  });
});

describe('parsing-rules › Spoken duration', () => {
  test('a new fixed duration is stored', async ({ db }) => {
    assert.equal(await edit(db, withDurations({ word: 'drie kwartier', minutes: 45, fixed: true })), undefined);
    assert.equal((await getRules(db)).fixed['drie kwartier'], 45);
  });
});

describe('parsing-rules › Duration per number', () => {
  test('a new duration word is stored with its minutes per number', async ({ db }) => {
    assert.equal(await edit(db, withDurations({ word: 'halfuur', minutes: 30, fixed: false })), undefined);
    assert.equal((await getRules(db)).perNumber.halfuur, 30);
  });
});

describe('parsing-rules › Spoken duration without minutes', () => {
  const index = toRows(defaultRules).durations.length;
  for (const minutes of [null, 0, 1.5, 1441, Number.MAX_SAFE_INTEGER + 2])
    test(`${minutes} minutes is refused on that row`, async ({ db }) => {
      const errors = await edit(db, withDurations({ word: 'een tijdje', minutes, fixed: true }));
      assert.deepEqual(Object.keys(errors?.durations?.rows ?? {}), [String(index)]);
    });

  test('nothing is stored', async ({ db }) => {
    await edit(db, withDurations({ word: 'een tijdje', minutes: null, fixed: true }));
    assert.equal(await rowCount(db), 0);
  });
});

describe('parsing-rules › Duration without word', () => {
  test('is refused on that row', async ({ db }) => {
    const errors = await edit(db, withDurations({ word: '', minutes: 15, fixed: true }));
    assert.deepEqual(Object.keys(errors?.durations?.rows ?? {}), [String(toRows(defaultRules).durations.length)]);
  });

  test('nothing is stored', async ({ db }) => {
    await edit(db, withDurations({ word: ' ', minutes: 15, fixed: true }));
    assert.equal(await rowCount(db), 0);
  });

  test('a row with neither word nor minutes is dropped', async ({ db }) => {
    assert.equal(await edit(db, withDurations({ word: '', minutes: null, fixed: false })), undefined);
  });
});

describe('parsing-rules › Empty list', () => {
  test('is refused at the list', async ({ db }) => {
    const errors = await edit(db, { units: ['', '  '] });
    assert.deepEqual(Object.keys(errors ?? {}), ['units']);
    assert.ok(errors?.units?.list);
  });

  test('nothing is stored', async ({ db }) => {
    await edit(db, { units: ['', '  '] });
    assert.equal(await rowCount(db), 0);
  });
});

describe('parsing-rules › No duration per number', () => {
  const allFixed = { durations: [{ word: 'een kwartier', minutes: 15, fixed: true }] };

  test('is refused at the list', async ({ db }) => {
    assert.ok((await edit(db, allFixed))?.durations?.list);
  });

  test('nothing is stored', async ({ db }) => {
    await edit(db, allFixed);
    assert.equal(await rowCount(db), 0);
  });
});

describe('parsing-rules › Word in two lists', () => {
  test('a duration word that is also a degree word is refused on the second row', async ({ db }) => {
    const errors = await edit(db, { degreeWords: ['graden', 'u'] });
    assert.deepEqual(Object.keys(errors ?? {}), ['degreeWords']);
    assert.deepEqual(Object.keys(errors?.degreeWords?.rows ?? {}), ['1']);
  });

  test('a unit may not be a degree word either', async ({ db }) => {
    assert.deepEqual(Object.keys((await edit(db, { degreeWords: ['graden', 'g'] })) ?? {}), ['degreeWords']);
  });

  test('a unit may not be a duration word', async ({ db }) => {
    assert.deepEqual(Object.keys((await edit(db, { units: ['g', 'uur'] })) ?? {}), ['durations']);
  });

  test('a fixed phrase may equal a unit', async ({ db }) => {
    assert.equal(await edit(db, withDurations({ word: 'g', minutes: 5, fixed: true })), undefined);
  });

  test('nothing is stored', async ({ db }) => {
    await edit(db, { degreeWords: ['graden', 'u'] });
    assert.equal(await rowCount(db), 0);
  });
});

describe('parsing-rules › Word twice in the durations', () => {
  const twice = withDurations({ word: 'uur', minutes: 60, fixed: true });
  const second = String(toRows(defaultRules).durations.length);

  test('is refused on the second row', async ({ db }) => {
    assert.deepEqual(Object.keys((await edit(db, twice))?.durations?.rows ?? {}), [second]);
  });

  test('nothing is stored', async ({ db }) => {
    await edit(db, twice);
    assert.equal(await rowCount(db), 0);
  });
});

describe('parsing-rules › Saving the unchanged defaults succeeds', () => {
  test('there are no errors', async ({ db }) => {
    assert.equal(await saveRules(db, toRows(defaultRules)).then((r) => r.errors), undefined);
  });

  test('the rules are still the defaults', async ({ db }) => {
    await saveRules(db, toRows(defaultRules));
    assert.deepEqual(await getRules(db), defaultRules);
  });
});

describe('parsing-rules › Word with other characters', () => {
  test('a plus sign is refused on that row', async ({ db }) => {
    const errors = await edit(db, { degreeWords: ['graden', 'a+'] });
    assert.deepEqual(Object.keys(errors?.degreeWords?.rows ?? {}), ['1']);
  });

  test('a plus sign in a duration is refused', async ({ db }) => {
    assert.ok((await edit(db, withDurations({ word: 'a+', minutes: 5, fixed: false })))?.durations?.rows);
  });

  // A unit is one word: no space or degree sign.
  test('a space in a unit is refused', async ({ db }) => {
    assert.deepEqual(Object.keys((await edit(db, { units: ['g', 'eetlepel vol'] })) ?? {}), ['units']);
  });

  test('a degree sign in a unit is refused', async ({ db }) => {
    assert.ok((await edit(db, { units: ['g', '°'] }))?.units?.rows);
  });

  test('nothing is stored', async ({ db }) => {
    await edit(db, { units: ['g', 'a+'] });
    await edit(db, { units: ['g', 'eetlepel vol'] });
    await edit(db, { units: ['g', '°'] });
    assert.equal(await rowCount(db), 0);
  });
});

describe('parsing-rules › Default loose units', () => {
  test('the stored rules hold the default loose units', async ({ db }) => {
    assert.deepEqual((await getRules(db)).looseUnits, 'snuf snufje scheut scheutje mespunt mespuntje handvol klont klontje'.split(' '));
  });
});

describe('getRules', () => {
  test('an empty saved loose unit list is kept, not replaced by the defaults', async ({ db }) => {
    await stored(db, '{"looseUnits":[]}');
    assert.deepEqual((await getRules(db)).looseUnits, []);
  });
});

describe('parsing-rules › Saved rules without loose units', () => {
  test('use the default loose units and keep the other saved words', async ({ db }) => {
    await stored(db, '{"units":["g","kopje"]}');
    const rules = await getRules(db);
    assert.deepEqual(rules.units, ['g', 'kopje']);
    assert.deepEqual(rules.looseUnits, defaultRules.looseUnits);
  });
});

describe('parsing-rules › Add a loose unit', () => {
  test('the loose units include the new word', async ({ db }) => {
    assert.equal(await edit(db, { looseUnits: [...defaultRules.looseUnits, 'druppel'] }), undefined);
    assert.ok((await getRules(db)).looseUnits.includes('druppel'));
  });
});

describe('parsing-rules › No loose units', () => {
  test('the save succeeds', async ({ db }) => {
    assert.equal(await edit(db, { looseUnits: [] }), undefined);
  });

  test('no word is a loose unit', async ({ db }) => {
    await edit(db, { looseUnits: [] });
    assert.deepEqual((await getRules(db)).looseUnits, []);
  });
});

describe('parsing-rules › Loose unit that is also a unit', () => {
  test('the save succeeds', async ({ db }) => {
    assert.equal(await edit(db, { units: ['g', 'snufje'], looseUnits: ['snufje'] }), undefined);
  });

  test('both lists keep the word', async ({ db }) => {
    await edit(db, { units: ['g', 'snufje'], looseUnits: ['snufje'] });
    const rules = await getRules(db);
    assert.ok(rules.units.includes('snufje'));
    assert.ok(rules.looseUnits.includes('snufje'));
  });
});

describe('parsing-rules › Loose unit with other characters', () => {
  test('a space is refused on that row', async ({ db }) => {
    const errors = await edit(db, { looseUnits: ['snuf', 'een druppel'] });
    assert.deepEqual(Object.keys(errors?.looseUnits?.rows ?? {}), ['1']);
  });

  test('nothing is stored', async ({ db }) => {
    await edit(db, { looseUnits: ['een druppel'] });
    assert.equal(await rowCount(db), 0);
  });
});
