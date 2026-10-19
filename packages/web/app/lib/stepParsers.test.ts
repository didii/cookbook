import assert from 'node:assert/strict';
import { test } from 'node:test';
import { findOven, findTimer } from './stepParsers';

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
