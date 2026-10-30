import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, test } from 'vitest';
import '~testing/dom';
import { keepNote, takeNote } from './keptNote';

const note = { text: 'tekst', base: 'oud' };

describe('keptNote', () => {
  test('gives back what was kept', () => {
    keepNote('A@x.nl', 'soep', note);
    assert.deepEqual(takeNote('a@x.nl', 'soep'), note);
  });

  test('removes the note once taken', () => {
    keepNote('a@x.nl', 'soep', note);
    takeNote('a@x.nl', 'soep');
    assert.equal(takeNote('a@x.nl', 'soep'), undefined);
  });

  test('keeps the note per member and recipe', () => {
    keepNote('a@x.nl', 'soep', note);
    assert.equal(takeNote('b@x.nl', 'soep'), undefined);
    assert.equal(takeNote('a@x.nl', 'taart'), undefined);
  });

  test('keeps an empty text', () => {
    keepNote('a@x.nl', 'soep', { text: '', base: '' });
    assert.deepEqual(takeNote('a@x.nl', 'soep'), { text: '', base: '' });
  });

  test('ignores an entry it cannot read', () => {
    window.localStorage.setItem('cookbook:note:a@x.nl:soep', 'geen json');
    assert.equal(takeNote('a@x.nl', 'soep'), undefined);
  });
});

describe('keptNote › blocked storage', () => {
  let real: PropertyDescriptor | undefined;
  beforeEach(() => {
    real = Object.getOwnPropertyDescriptor(window, 'localStorage');
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('blocked');
      },
    });
  });
  afterEach(() => {
    if (real) Object.defineProperty(window, 'localStorage', real);
    else delete (window as { localStorage?: unknown }).localStorage;
  });

  test('keeping and taking do not throw', () => {
    keepNote('a@x.nl', 'soep', note);
    assert.equal(takeNote('a@x.nl', 'soep'), undefined);
  });
});
