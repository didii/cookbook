import assert from 'node:assert/strict';
import { test } from 'node:test';
import { findRecipe, recipes, type Recipe } from './recipes';

// The shape of the page's data: StoredRecipe's field names, plus what the redesigned view needs per step.
test('every sample recipe is complete and its steps are well formed', () => {
  assert.equal(new Set(recipes.map((r) => r.slug)).size, recipes.length);
  assert.equal(new Set(recipes.map((r) => r.id)).size, recipes.length);
  for (const r of recipes) {
    assert.ok(r.title && r.author && r.intro, r.slug);
    assert.ok(r.ingredients.length > 0 && r.steps.length > 0, r.slug);
    for (const s of r.steps) {
      assert.ok(s.body.trim(), `${r.slug}: step text`);
      assert.ok(s.ovenTemperature === undefined || (s.ovenTemperature >= 50 && s.ovenTemperature <= 300), `${r.slug}: oven`);
      assert.ok(!s.timer || (s.timer.minutes > 0 && Number.isInteger(s.timer.minutes)), `${r.slug}: timer`);
      for (const c of s.ingredients) assert.ok(c.name, `${r.slug}: chip name`);
    }
  }
});

// What the design preview shows for the Appeltaart, step by step: [ingredient chips, oven °C, timer minutes + label].
const preview: [string[], number | undefined, [number, string] | undefined][] = [
  [['250 g zelfrijzende bloem', '150 g koude boter', '100 g basterdsuiker', '1 ei', '½ tl zout'], undefined, undefined],
  [[], undefined, [30, 'Deeg rust']],
  [['1 klontje boter'], 180, undefined],
  [['1 kg zure appels', '¾ tl kaneel'], undefined, undefined],
  [['1 snuf zout'], undefined, [20, 'Appels smoren']],
  [[], undefined, [10, 'Uitlekken']],
  [[], undefined, undefined],
  [[], undefined, undefined],
  [['1 losgeklopt ei'], undefined, undefined],
  [[], 180, [50, 'Bakken']],
  [[], undefined, [45, 'Afkoelen']],
  [['2 el poedersuiker'], undefined, undefined],
  [['1 bakje slagroom'], undefined, undefined],
];

test('the Appeltaart holds everything the design preview shows', () => {
  const { steps, ingredients } = findRecipe('appeltaart')!;
  assert.deepEqual(
    ingredients.map((x) => `${x.quantity_text} ${x.name}`),
    ['250 g zelfrijzende bloem', '150 g koude boter', '100 g basterdsuiker', '1 ei', '½ tl zout', '1 kg zure appels', '¾ tl kaneel'],
  );
  assert.deepEqual(
    steps.map((s): (typeof preview)[number] => [
      s.ingredients.map((x) => `${x.quantity_text} ${x.name}`.trim()),
      s.ovenTemperature,
      s.timer && [s.timer.minutes, s.timer.label ?? ''],
    ]),
    preview,
  );
});

test('the sample type can stand in for a stored recipe', () => {
  // Compile-time: every StoredRecipe field exists on Recipe with a compatible type, except that steps carry more.
  const r: Recipe = recipes[0];
  const row: Omit<import('~/.server/recipes').StoredRecipe, 'steps'> = r;
  assert.equal(row.slug, r.slug);
});
