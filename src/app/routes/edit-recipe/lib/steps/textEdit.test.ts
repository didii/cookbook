import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { computeEdit, type TextEdit } from './textEdit';

/** What the old text becomes when the edit is applied: proves the edit describes the change. */
const apply = (prev: string, next: string, e: TextEdit) =>
  prev.slice(0, e.start) + next.slice(e.start, e.start + e.inserted) + prev.slice(e.start + e.removed);
/** Whether index i lies between the two halves of a surrogate pair. */
const splits = (t: string, i: number) =>
  t.charCodeAt(i - 1) >= 0xd800 && t.charCodeAt(i - 1) <= 0xdbff && t.charCodeAt(i) >= 0xdc00 && t.charCodeAt(i) <= 0xdfff;

describe('recipe-step-editing › Typing is a one-character insertion', () => {
  test('with a caret hint', () => {
    assert.deepEqual(computeEdit('abcd', 'abXcd', { start: 2, end: 2 }), { start: 2, removed: 0, inserted: 1 });
  });

  // Without a hint the comparison finds the same, also at the ends and in an empty text.
  test('without a hint', () => {
    assert.deepEqual(computeEdit('abcd', 'abXcd'), { start: 2, removed: 0, inserted: 1 });
  });

  test('into an empty text', () => {
    assert.deepEqual(computeEdit('', 'a'), { start: 0, removed: 0, inserted: 1 });
  });

  test('at the end of the text', () => {
    assert.deepEqual(computeEdit('ab', 'abc', { start: 2, end: 2 }), { start: 2, removed: 0, inserted: 1 });
  });
});

describe('recipe-step-editing › Pasting over a selection', () => {
  test('replaces the selected range', () => {
    assert.deepEqual(computeEdit('0123456789', '01XXXXX56789', { start: 2, end: 5 }), { start: 2, removed: 3, inserted: 5 });
  });

  // A paste of what was selected is still a replacement of the selection.
  test('pasting what was selected is still a replacement', () => {
    assert.deepEqual(computeEdit('aaaa', 'aaaa', { start: 1, end: 3 }), { start: 1, removed: 2, inserted: 2 });
  });
});

describe('recipe-step-editing › Cutting removes a range', () => {
  test('removes the selected range', () => {
    assert.deepEqual(computeEdit('0123456789', '0156789', { start: 2, end: 5 }), { start: 2, removed: 3, inserted: 0 });
  });

  // Backspace with a collapsed caret: the hint does not fit, the comparison does.
  test('backspace with a collapsed caret', () => {
    assert.deepEqual(computeEdit('abc', 'ac', { start: 2, end: 2 }), { start: 1, removed: 1, inserted: 0 });
  });
});

describe('recipe-step-editing › Emoji are never split', () => {
  const smile = '\u{1F600}';
  const grin = '\u{1F601}';

  test('inserting one emoji next to another', () => {
    assert.deepEqual(computeEdit(`a${smile}`, `a${smile}${grin}`, { start: 3, end: 3 }), { start: 3, removed: 0, inserted: 2 });
  });

  test('deleting one of two emoji', () => {
    assert.deepEqual(computeEdit(`a${smile}${grin}`, `a${smile}`), { start: 3, removed: 2, inserted: 0 });
  });

  // Replacing an emoji by one that shares its first code unit: the common prefix ends between the halves.
  test('replacing an emoji by one that shares its first code unit', () => {
    assert.deepEqual(computeEdit(`a${smile}b`, `a${grin}b`), { start: 1, removed: 2, inserted: 2 });
  });

  test('a hint that starts between the halves of an emoji', () => {
    assert.deepEqual(computeEdit(`a${smile}b`, 'axb', { start: 2, end: 3 }), { start: 1, removed: 2, inserted: 1 });
  });

  // A family emoji (ZWJ sequence) edited in several ways: no edit starts or ends between surrogates.
  const family = '\u{1F468}‍\u{1F469}‍\u{1F467}';
  const prev = `x${family}y`;
  const edits = {
    'cut short': `x${family.slice(0, 2)}y`,
    'with one member replaced': `x${family.replace('\u{1F469}', '\u{1F46A}')}y`,
    removed: 'xy',
  };
  for (const [name, next] of Object.entries(edits)) {
    test(`a family emoji ${name} is not split`, () => {
      const e = computeEdit(prev, next);
      assert.equal(apply(prev, next, e), next);
      for (const i of [e.start, e.start + e.removed]) assert.equal(splits(prev, i), false, `${next} splits prev at ${i}`);
      for (const i of [e.start, e.start + e.inserted]) assert.equal(splits(next, i), false, `${next} splits next at ${i}`);
    });
  }
});

describe('recipe-step-editing › Undo and redo are reported', () => {
  // No hint: the range is found by comparing.
  test('undoing an insertion at the end', () => {
    assert.deepEqual(computeEdit('hello world', 'hello'), { start: 5, removed: 6, inserted: 0 });
  });

  test('redoing an insertion at the end', () => {
    assert.deepEqual(computeEdit('hello', 'hello world'), { start: 5, removed: 0, inserted: 6 });
  });

  // Repeated characters: any equivalent place is valid, but the result must reproduce the text and be minimal.
  for (const [prev, next] of [
    ['aaa', 'aa'],
    ['aa', 'aaa'],
    ['abab', 'ab'],
    ['xaax', 'xax'],
  ]) {
    test(`repeated characters, ${prev} to ${next}, give a minimal edit that reproduces the text`, () => {
      const e = computeEdit(prev, next);
      assert.equal(apply(prev, next, e), next);
      assert.equal(e.inserted - e.removed, next.length - prev.length);
      assert.equal(Math.min(e.removed, e.inserted), 0);
    });
  }

  // A hint that does not fit the change (the caret was elsewhere) is ignored.
  test('a hint that does not fit the change is ignored', () => {
    assert.deepEqual(computeEdit('hello world', 'hello', { start: 0, end: 0 }), { start: 5, removed: 6, inserted: 0 });
  });

  test('an unchanged text is an empty edit at its end', () => {
    assert.deepEqual(computeEdit('same', 'same'), { start: 4, removed: 0, inserted: 0 });
  });
});
