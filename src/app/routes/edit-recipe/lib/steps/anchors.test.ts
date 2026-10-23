import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import type { Range } from '~app/shared/stepParsers';
import { mapRange } from './anchors';
import { computeEdit, type TextEdit } from './textEdit';

const edit = (start: number, removed: number, inserted: number): TextEdit => ({ start, removed, inserted });
/** Applies an edit to a text, with the new characters being `with`. */
const apply = (text: string, { start, removed }: TextEdit, insert: string) => text.slice(0, start) + insert + text.slice(start + removed);
const words = (text: string, range?: Range) => range && text.slice(range.start, range.end);

/** Applies a replacement the way the editor reports it and maps the range of `phrase` through it. */
function run(text: string, phrase: string, at: number, removed: number, insert: string) {
  const range = { start: text.indexOf(phrase), end: text.indexOf(phrase) + phrase.length };
  const e = edit(at, removed, insert.length);
  const next = apply(text, e, insert);
  return { next, words: words(next, mapRange(range, e)) };
}

const text = 'Laat 30 minuten rusten';

describe('recipe-step-chips › Text before an anchor moves it', () => {
  test('text inserted at the start of the line', () => {
    assert.equal(run(text, '30 minuten', 0, 0, 'Dan ').words, '30 minuten');
  });

  test('text deleted before the anchor', () => {
    assert.equal(run(text, '30 minuten', 1, 2, '').words, '30 minuten');
  });

  test('text before the anchor replaced', () => {
    assert.equal(run(text, '30 minuten', 0, 4, 'Wacht').words, '30 minuten');
  });
});

describe('recipe-step-chips › Text inside an anchor stretches it', () => {
  test('a character inserted inside', () => {
    assert.equal(run(text, '30 minuten', 7, 0, '0').words, '300 minuten');
  });

  test('a character deleted inside', () => {
    assert.equal(run(text, '30 minuten', 9, 1, '').words, '30 mnuten');
  });

  test('a character inserted in the middle of a word', () => {
    assert.equal(run(text, '30 minuten', 8, 0, 'x').words, '30 xminuten');
  });
});

describe('recipe-step-chips › Text typed at an edge stays outside', () => {
  test('typed at the start', () => {
    assert.equal(run(text, '30 minuten', 5, 0, 'x').words, '30 minuten');
  });

  test('typed at the end', () => {
    assert.equal(run(text, '30 minuten', 15, 0, 'x').words, '30 minuten');
  });

  test('several characters typed at the end', () => {
    assert.equal(run(text, '30 minuten', 15, 0, ' extra').words, '30 minuten');
  });
});

describe('recipe-step-chips › Characters that take two code units shift by two', () => {
  test('an emoji typed before the anchor', () => {
    assert.equal(run(text, '30 minuten', 0, 0, '😀').words, '30 minuten');
  });

  test('the range shifts by two code units', () => {
    assert.deepEqual(mapRange({ start: 5, end: 15 }, edit(0, 0, 2)), { start: 7, end: 17 });
  });

  // Typed by the real diff: a ZWJ sequence before the anchor.
  test('a ZWJ sequence typed before the anchor shifts by its length', () => {
    const family = '👨‍👩‍👧';
    const next = family + text;
    assert.deepEqual(mapRange({ start: 5, end: 15 }, computeEdit(text, next)), { start: 5 + family.length, end: 15 + family.length });
  });
});

describe('recipe-step-chips › Replacing an edge cuts the anchor back', () => {
  // The end of the anchor and the text after it are replaced.
  test('replacing the end', () => {
    assert.equal(run(text, '30 minuten', 12, 8, 'wachten').words, '30 minu');
  });

  // The start of the anchor and the text before it are replaced.
  test('replacing the start', () => {
    assert.equal(run(text, '30 minuten', 2, 6, 'XYZ').words, 'minuten');
  });
});

describe("recipe-step-chips › Replacing all of an anchor's words keeps the anchor on the new words", () => {
  test('only the words replaced', () => {
    assert.equal(run(text, '30 minuten', 5, 10, '45 minuten').words, '45 minuten');
  });

  // A selection that also takes text on both sides.
  test('a selection that also takes text on both sides', () => {
    assert.equal(run(text, '30 minuten', 4, 12, ' een uur ').words, ' een uur ');
  });
});

describe("recipe-step-chips › Deleting an anchor's words loses it", () => {
  test('deleting exactly the words', () => {
    assert.equal(mapRange({ start: 5, end: 15 }, edit(5, 10, 0)), undefined);
  });

  test('deleting the words and text around them', () => {
    assert.equal(mapRange({ start: 5, end: 15 }, edit(3, 14, 0)), undefined);
  });
});

/** Small seeded generator, so a failure can be repeated. */
function random(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('recipe-step-chips › Anchors survive random edits elsewhere', () => {
  const phrase = '30 minuten';
  const pieces = ['a', 'bc', ' ', '😀', 'xyz ', '👨‍👩‍👧', 'é'];
  for (const seed of [1, 2, 3, 4, 5]) {
    test(`300 random edits around the anchor, seed ${seed}`, () => {
      const next = random(seed);
      const pick = (n: number) => Math.floor(next() * n);
      let text = `begin ${phrase} einde`;
      let range: Range = { start: 6, end: 6 + phrase.length };
      for (let step = 0; step < 300; step++) {
        // Only before the phrase or only after it (typing at its edges included), never touching its words.
        const side = next() < 0.5 ? 'before' : 'after';
        const [from, to] = side === 'before' ? [0, range.start] : [range.end, text.length];
        let start = from + pick(to - from + 1);
        // A deletion or replacement must not cut a surrogate pair in two: widen like the editor does.
        let removed = pick(Math.min(4, to - start) + 1);
        while (start > from && /[\udc00-\udfff]/.test(text[start] ?? '')) start--;
        while (start + removed < to && /[\udc00-\udfff]/.test(text[start + removed] ?? '')) removed++;
        if (start + removed > to) removed = to - start;
        const insert = next() < 0.3 ? '' : pieces[pick(pieces.length)];
        const e = edit(start, removed, insert.length);
        text = apply(text, e, insert);
        range = mapRange(range, e)!;
        assert.ok(range, `seed ${seed} step ${step}: the anchor was lost`);
        assert.equal(words(text, range), phrase, `seed ${seed} step ${step}`);
      }
    });
  }
});
