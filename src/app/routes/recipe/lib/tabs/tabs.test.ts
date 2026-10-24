import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { arrive, tabForKey, tabFromHash, type Positions, type TabId } from './tabs';

describe('tabFromHash', () => {
  test('a location hash names a tab', () => {
    assert.equal(tabFromHash('#steps'), 'steps');
    assert.equal(tabFromHash('#ingredients'), 'ingredients');
  });

  test('an empty hash names none', () => {
    assert.equal(tabFromHash(''), undefined);
  });

  test('any other hash names none', () => {
    assert.equal(tabFromHash('#step-3'), undefined);
  });
});

describe('tabForKey', () => {
  test('ArrowRight moves to the next tab, wrapping around', () => {
    assert.equal(tabForKey('ingredients', 'ArrowRight'), 'steps');
    assert.equal(tabForKey('steps', 'ArrowRight'), 'ingredients');
  });

  test('ArrowLeft moves to the previous tab, wrapping around', () => {
    assert.equal(tabForKey('ingredients', 'ArrowLeft'), 'steps');
  });

  test('Home goes to the first tab', () => {
    assert.equal(tabForKey('steps', 'Home'), 'ingredients');
  });

  test('End goes to the last tab', () => {
    assert.equal(tabForKey('ingredients', 'End'), 'steps');
  });

  test('any other key changes nothing', () => {
    assert.equal(tabForKey('ingredients', 'a'), undefined);
  });
});

const heading = 500;
const stackHeight = 60;
const at = (positions: Positions, from: TabId, to: TabId) => arrive(positions, from, to, heading, stackHeight);

describe('recipe-viewing › Position is remembered', () => {
  // Both tabs were scrolled into: each opens where it was left, in either direction.
  const positions = { steps: 1200, ingredients: 700 };

  test('steps open where they were left', () => {
    assert.equal(at(positions, 'ingredients', 'steps'), 1200);
  });

  test('ingredients open where they were left', () => {
    assert.equal(at(positions, 'steps', 'ingredients'), 700);
  });

  test('the new tab keeps its position when only it has one', () => {
    assert.equal(at({ ingredients: 700 }, 'steps', 'ingredients'), 700);
  });
});

describe('recipe-viewing › First visit of a tab', () => {
  // Only the old tab was scrolled into: the heading just under the stack, and not above the top of the page.
  test('the heading ends up just under the stack', () => {
    assert.equal(at({ steps: 1200 }, 'steps', 'ingredients'), 440);
  });

  test('the position is never above the top of the page', () => {
    assert.equal(arrive({ steps: 1200 }, 'steps', 'ingredients', 20, stackHeight), 0);
  });
});

describe('recipe-viewing › Tabs swap in place', () => {
  test('steps to ingredients has no position', () => {
    assert.equal(at({}, 'steps', 'ingredients'), undefined);
  });

  test('ingredients to steps has no position', () => {
    assert.equal(at({}, 'ingredients', 'steps'), undefined);
  });
});
