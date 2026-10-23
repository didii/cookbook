import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createTestDb } from '~testing/db';
import { parseIngredient } from '~app/lib/ingredients';
import { defaultRules } from '~app/lib/rules';
import { scaleBody } from '~app/lib/scale';
import { findOven, findTimer } from '~app/lib/stepParsers';
import { getRules, resetRules, saveRules, toFields, type RulesFields } from './rules';

let db: D1Database;
let dispose: () => Promise<void>;

before(async () => {
  ({ db, dispose } = await createTestDb());
});

after(() => dispose());

// Every test starts and ends on the defaults, so the order does not matter.
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

test('parsing-rules › Default rules', async () => {
  await resetRules(db);
  const rules = await getRules(db);
  assert.deepEqual(rules, defaultRules);
  assert.equal(findTimer('30 minuten', rules)?.values.minutes, 30);
  assert.equal(findTimer('1,5 uur', rules)?.values.minutes, 90);
  assert.equal(findTimer('een kwartier', rules)?.values.minutes, 15);
  assert.equal(findOven('180 graden', rules)?.values.degrees, 180);
  assert.equal(parseIngredient('250 g bloem', rules).unit, 'g');
});

test('parsing-rules › Degree words include the degree sign', () => {
  for (const text of ['180°', '180 °C', '180 graden']) assert.equal(findOven(text, defaultRules)?.values.degrees, 180, text);
});

test('parsing-rules › Grams are not degrees', () => {
  assert.equal(findOven('180 gr', defaultRules), undefined);
  assert.equal(parseIngredient('180 gr bloem', defaultRules).unit, 'gr');
});

test('parsing-rules › Unreadable saved rules', async () => {
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
  ]) {
    await stored(value);
    assert.deepEqual(await getRules(db), defaultRules, value);
  }
  // A field an older value lacks takes its default.
  await stored('{"units":["g"]}');
  assert.deepEqual(await getRules(db), { ...defaultRules, units: ['g'] });
  await resetRules(db);
});

test('parsing-rules › Restore defaults', async () => {
  assert.equal(await edit({ units: 'g\nkopje' }), undefined);
  assert.ok((await getRules(db)).units.includes('kopje'));
  await resetRules(db);
  assert.equal(await rowCount(), 0);
  assert.equal((await getRules(db)).units.includes('kopje'), false);
});

test('parsing-rules › Add a unit', async () => {
  assert.equal(await edit({ units: toFields(defaultRules).units + '\nKopje\n\nkopje' }), undefined);
  const rules = await getRules(db);
  assert.equal(rules.units.filter((u) => u === 'kopje').length, 1); // lowercased, repeat dropped
  assert.equal(toFields(rules).units.includes('kopje'), true); // what the page shows
  await resetRules(db);
});

test('parsing-rules › Remove a word', async () => {
  assert.equal(await edit({ minuteWords: 'minuten\nminuut' }), undefined);
  assert.deepEqual((await getRules(db)).minuteWords, ['minuten', 'minuut']);
  await resetRules(db);
});

test('parsing-rules › Spoken duration', async () => {
  assert.equal(await edit({ spoken: toFields(defaultRules).spoken + '\ndrie kwartier = 45' }), undefined);
  assert.equal((await getRules(db)).spoken['drie kwartier'], 45);
  await resetRules(db);
});

test('parsing-rules › Spoken duration without minutes', async () => {
  for (const line of [
    'een tijdje',
    'een tijdje = 0',
    'een tijdje = x',
    'een tijdje = 1,5',
    'een tijdje = 1441',
    'een tijdje = 999999999999999999999',
  ]) {
    const errors = await edit({ spoken: line });
    assert.match(errors?.spoken ?? '', /heel aantal minuten/, line);
  }
  assert.equal(await rowCount(), 0);
});

test('parsing-rules › Empty list', async () => {
  const errors = await edit({ units: '\n  \n' });
  assert.match(errors?.units ?? '', /niet leeg/);
  assert.equal(await rowCount(), 0);
});

test('parsing-rules › Word in two lists', async () => {
  assert.match((await edit({ minuteWords: 'minuten\nu' }))?.hourWords ?? '', /lijst/);
  // A unit may not be a degree word either.
  assert.match((await edit({ degreeWords: 'graden\ng' }))?.degreeWords ?? '', /één lijst/);
  assert.equal(await rowCount(), 0);
});

test('parsing-rules › Saving the unchanged defaults succeeds', async () => {
  assert.equal(await saveRules(db, toFields(defaultRules)).then((r) => r.errors), undefined);
  assert.deepEqual(await getRules(db), defaultRules);
  await resetRules(db);
});

test('parsing-rules › Word with other characters', async () => {
  const errors = await edit({ units: 'g\na+' });
  assert.match(errors?.units ?? '', /letters/);
  // A unit is one word: no space or degree sign.
  assert.match((await edit({ units: 'g\neetlepel vol' }))?.units ?? '', /letters/);
  assert.match((await edit({ units: 'g\n°' }))?.units ?? '', /letters/);
  assert.equal(await rowCount(), 0);
});

// Recognition follows the rules.
const withRules = (change: Partial<typeof defaultRules>) => ({ ...defaultRules, ...change });

test('parsing-rules › Words are not regular expressions', () => {
  const rules = withRules({ minuteWords: ['m+'] });
  assert.equal(findTimer('20 m+', rules)?.values.minutes, 20);
  assert.equal(findTimer('20 mmm', rules), undefined);
});

test('parsing-rules › New unit is recognised', () => {
  const parsed = parseIngredient('2 kopje rijst', withRules({ units: [...defaultRules.units, 'kopje'] }));
  assert.deepEqual([parsed.unit, parsed.name], ['kopje', 'rijst']);
});

test('parsing-rules › New minute word makes a timer', () => {
  const rules = withRules({ minuteWords: [...defaultRules.minuteWords, 'mins'] });
  assert.equal(findTimer('Bak 20 mins', rules)?.values.minutes, 20);
  assert.equal(findTimer('Bak 20 mins', defaultRules), undefined);
});

test('parsing-rules › New spoken duration makes a timer', () => {
  const rules = withRules({ spoken: { ...defaultRules.spoken, 'drie kwartier': 45 } });
  assert.equal(findTimer('Bak drie kwartier', rules)?.values.minutes, 45);
});

test('parsing-rules › Removed word is not recognised', () => {
  const rules = withRules({ degreeWords: ['°c', '°'] });
  assert.equal(findOven('180 graden', rules), undefined);
  assert.equal(findOven('180 °C', rules)?.values.degrees, 180);
});

test('parsing-rules › Scaling uses the stored units', () => {
  const rules = withRules({ units: [...defaultRules.units, 'kopje'] });
  const rows = [{ id: '0', quantityText: '2 kopje', name: 'rijst' }];
  assert.equal(scaleBody('doe 2 kopje bloem erbij', 2, [], rules), 'doe 4 kopje bloem erbij');
  assert.equal(scaleBody('doe 2 kopje bloem erbij', 2, rows, defaultRules), 'doe 2 kopje bloem erbij');
});
