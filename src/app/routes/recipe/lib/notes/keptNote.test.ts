import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import '~testing/dom';
import { keepNote, takeNote } from './keptNote';

describe('keptNote', () => {
  test('gives back what was kept', () => {
    keepNote('A@x.nl', 'soep', 'tekst');
    assert.equal(takeNote('a@x.nl', 'soep'), 'tekst');
  });

  test('removes the text once taken', () => {
    keepNote('a@x.nl', 'soep', 'tekst');
    takeNote('a@x.nl', 'soep');
    assert.equal(takeNote('a@x.nl', 'soep'), undefined);
  });

  test('keeps the text per member and recipe', () => {
    keepNote('a@x.nl', 'soep', 'tekst');
    assert.equal(takeNote('b@x.nl', 'soep'), undefined);
    assert.equal(takeNote('a@x.nl', 'taart'), undefined);
  });

  test('keeps an empty text', () => {
    keepNote('a@x.nl', 'soep', '');
    assert.equal(takeNote('a@x.nl', 'soep'), '');
  });

  test('ignores a storage that throws', () => {
    const real = Object.getOwnPropertyDescriptor(window, 'localStorage');
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('blocked');
      },
    });
    try {
      keepNote('a@x.nl', 'soep', 'tekst');
      assert.equal(takeNote('a@x.nl', 'soep'), undefined);
    } finally {
      if (real) Object.defineProperty(window, 'localStorage', real);
      else delete (window as { localStorage?: unknown }).localStorage;
    }
  });
});
