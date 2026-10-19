import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseIngredient } from '~/lib/ingredients';
import { findIngredients, findOven, findTimer, type Row } from './stepParsers';

const minutes = (text: string) => findTimer(text)?.values.minutes;
const degrees = (text: string) => findOven(text)?.values.degrees;
const words = (text: string, found?: { start: number; end: number }) => found && text.slice(found.start, found.end);

test('recipe-step-chips › Minutes become a timer', () => {
  for (const unit of ['minuten', 'min', 'minuut']) {
    const text = `Laat 30 ${unit} rusten.`;
    assert.equal(minutes(text), 30);
    assert.equal(words(text, findTimer(text)), `30 ${unit}`);
  }
  assert.equal(minutes('Laat 30 MINUTEN rusten'), 30);
});

test('recipe-step-chips › Hours and fractions of hours', () => {
  assert.equal(minutes('Kook 2 uur'), 120);
  assert.equal(minutes('Kook 1,5 uur'), 90);
  assert.equal(minutes('Kook 1.5 uur'), 90);
  assert.equal(minutes('Kook 1 u'), 60);
});

test('recipe-step-chips › Spoken amounts', () => {
  assert.equal(minutes('Laat een half uur staan'), 30);
  assert.equal(minutes('Laat een kwartier staan'), 15);
  assert.equal(minutes('Laat anderhalf uur staan'), 90);
  assert.equal(minutes('Laat Een Uur staan'), 60);
});

test('recipe-step-chips › A range uses its lower value', () => {
  const text = 'Bak 20-25 minuten';
  assert.equal(minutes(text), 20);
  assert.equal(words(text, findTimer(text)), '20-25 minuten');
  assert.equal(minutes('Bak 20 – 25 min'), 20);
});

test('recipe-step-chips › Text without a duration has no timer', () => {
  assert.equal(findTimer('Voeg 30 gram boter toe'), undefined);
  assert.equal(findTimer('Voeg 30 m toe'), undefined);
  assert.equal(findTimer('Roer goed'), undefined);
  // Half typed: the chip appears when the word is complete.
  assert.equal(findTimer('Laat 30 mi'), undefined);
  assert.equal(findTimer('Laat 30 minu'), undefined);
  assert.equal(findTimer('Laat 0 minuten rusten'), undefined);
  assert.equal(findTimer('Laat 130 uurwerken'), undefined);
});

test('recipe-step-chips › Only the first duration is a timer', () => {
  const text = 'Kook 10 minuten en daarna 20 minuten';
  assert.equal(minutes(text), 10);
  assert.equal(words(text, findTimer(text)), '10 minuten');
});

test('recipe-step-chips › Degrees become an oven temperature', () => {
  for (const written of ['180 graden', '180 °C', '180°C', '180 °', '180 gr', '180 Graden']) {
    const text = `Verwarm op ${written} voor.`;
    assert.equal(degrees(text), 180, written);
    assert.equal(words(text, findOven(text)), written);
  }
});

test('recipe-step-chips › Implausible numbers are ignored', () => {
  assert.equal(degrees('Op 3 graden'), undefined);
  assert.equal(degrees('Op 1500 graden'), undefined);
  assert.equal(degrees('Op 49 graden'), undefined);
  assert.equal(degrees('Op 301 graden'), undefined);
  assert.equal(degrees('Op 50 graden'), 50);
  assert.equal(degrees('Op 300 graden'), 300);
});

test('recipe-step-chips › Only the first temperature counts', () => {
  const text = 'Eerst 180 graden, daarna 200 graden';
  assert.equal(degrees(text), 180);
  assert.equal(words(text, findOven(text)), '180 graden');
  // An implausible first number does not hide a later plausible one.
  assert.equal(degrees('3 graden warmer, 200 graden'), 200);
});

const row = (id: string, line: string): Row => {
  const { quantityText, name } = parseIngredient(line);
  return { id, quantityText, name };
};
const none = () => '';
const found = (text: string, rows: Row[], fallback: (r: Row) => string = none) =>
  findIngredients(text, rows, fallback).map((f) => ({ row: f.rowId, words: text.slice(f.start, f.end), ...f.values }));

test('recipe-step-chips › Name in the text creates an ingredient chip', () => {
  const rows = [row('a', '250 g zelfrijzende bloem')];
  assert.deepEqual(found('Meng de bloem met water.', rows), [{ row: 'a', words: 'bloem', quantity: '', name: 'zelfrijzende bloem' }]);
  assert.deepEqual(
    found('Meng de BLOEM met water.', rows).map((f) => f.words),
    ['BLOEM'],
  );
});

test('recipe-step-chips › Plurals match', () => {
  const rows = [row('ei', '2 ei'), row('ui', '1 ui')];
  assert.deepEqual(
    found('Klop de eieren en snijd de uien.', rows).map((f) => [f.row, f.words]),
    [
      ['ei', 'eieren'],
      ['ui', 'uien'],
    ],
  );
});

test('recipe-step-chips › The longest name wins', () => {
  const rows = [row('b', '100 g boter'), row('k', '150 g koude boter')];
  assert.deepEqual(
    found('Snijd de koude boter in blokjes.', rows).map((f) => [f.row, f.words]),
    [['k', 'koude boter']],
  );
  // Without the longer name written out, the shorter row matches again.
  assert.deepEqual(
    found('Snijd de boter in blokjes.', rows).map((f) => [f.row, f.words]),
    [['b', 'boter']],
  );
});

test('recipe-step-chips › Other words create nothing', () => {
  assert.deepEqual(found('Roer goed en laat rusten.', [row('a', '250 g bloem'), row('b', 'boter')]), []);
  assert.deepEqual(found('Alles roeren', [row('a', '250 g bloem')]), []);
  assert.deepEqual(found('bloem', [row('a', '250 g')]), []);
});

test('recipe-step-chips › An ingredient is chipped once per step', () => {
  const text = 'Voeg bloem toe en daarna nog meer bloem.';
  assert.deepEqual(
    found(text, [row('a', 'bloem')]).map((f) => f.words),
    ['bloem'],
  );
  assert.equal(findIngredients(text, [row('a', 'bloem')], none)[0].start, text.indexOf('bloem'));
});

test('recipe-step-chips › Amount written before the name', () => {
  const text = 'Smelt 100 g boter in een pan.';
  assert.deepEqual(
    found(text, [row('b', '150 g boter')], () => '150 g'),
    [{ row: 'b', words: '100 g boter', quantity: '100 g', name: 'boter' }],
  );
  assert.deepEqual(
    found('Klop 2 eieren.', [row('e', 'ei')]).map((f) => [f.words, f.quantity]),
    [['2 eieren', '2']],
  );
  assert.deepEqual(
    found('Wel 100g boter.', [row('b', 'boter')]).map((f) => f.words),
    ['100g boter'],
  );
  // A duration is not an amount.
  assert.deepEqual(
    found('Na 10 minuten boter toevoegen.', [row('b', 'boter')]).map((f) => f.words),
    ['boter'],
  );
});

test('recipe-step-chips › Amount from the list when only this step uses the ingredient', () => {
  const rows = [row('a', '250 g zelfrijzende bloem')];
  assert.equal(found('Zeef de bloem.', rows, (r) => r.quantityText)[0].quantity, '250 g');
});

test('plural forms of ingredients', () => {
  const words = (text: string, line: string) => found(text, [row('x', line)]).map((f) => f.words);
  assert.deepEqual(words('Was de bessen.', 'bes'), ['bessen']);
  assert.deepEqual(words('Was de bes.', 'bessen'), ['bes']);
  assert.deepEqual(words('Snijd de tomaten.', 'tomaat'), ['tomaten']);
  assert.deepEqual(words('Schil de appels.', 'appel'), ['appels']);
  assert.deepEqual(words('Hak de ui fijn.', 'uien'), ['ui']);
  assert.deepEqual(words("Bak de paddestoelen en de auto's.", 'auto'), ["auto's"]);
  assert.deepEqual(words('Schil de Peren.', 'peer'), ['Peren']);
  assert.deepEqual(words('Voeg crème toe.', 'creme'), ['crème']);
  assert.deepEqual(words('Voeg bloemen toe.', 'bloem'), ['bloemen']);
  assert.deepEqual(words('Voeg bakstenen toe.', 'bloem'), []);
});
