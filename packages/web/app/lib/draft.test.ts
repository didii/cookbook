import assert from 'node:assert/strict';
import { test } from 'node:test';
import { emptyDraft, isDirty, startingDraft } from './draft';

const stored = { ...emptyDraft, title: 'Soep', author: 'Oma' };

test('equal drafts are not dirty', () => assert.equal(isDirty(stored, { ...stored }), false));

test('a changed field is dirty', () => assert.equal(isDirty(stored, { ...stored, time: '1 uur' }), true));

test('a whitespace-only difference is not dirty', () => assert.equal(isDirty(stored, { ...stored, title: ' Soep ' }), false));

test('reverting a change is not dirty again', () => {
  const changed = { ...stored, intro: 'x' };
  assert.equal(isDirty(stored, changed), true);
  assert.equal(isDirty(stored, { ...changed, intro: '' }), false);
});

test('the starting draft is the stored values, or empty', () => {
  assert.deepEqual(startingDraft(stored), stored);
  assert.deepEqual(startingDraft(), emptyDraft);
});
