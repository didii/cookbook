import assert from 'node:assert/strict';
import { test } from 'node:test';
import { safeReturnUrl } from './returnUrl';

test('a path of this site, with its query, is kept', () => {
  assert.equal(safeReturnUrl('/recepten/soep'), '/recepten/soep');
  assert.equal(safeReturnUrl('/?q=soep&sort=az'), '/?q=soep&sort=az');
  assert.equal(safeReturnUrl('/recepten/soep?x=%2F%2Fevil.test#stap'), '/recepten/soep?x=%2F%2Fevil.test#stap');
});

test('anything that could leave the site goes home', () => {
  for (const bad of [
    '//evil.test',
    '//evil.test/recepten',
    'https://evil.test',
    'http://evil.test/',
    'javascript:alert(1)',
    '/\\evil.test',
    '/\\/evil.test',
    '\\\\evil.test',
    '/\t/evil.test',
    '/\n/evil.test',
    'recepten/soep',
    '',
  ])
    assert.equal(safeReturnUrl(bad), '/', JSON.stringify(bad));
  assert.equal(safeReturnUrl(null), '/');
  assert.equal(safeReturnUrl(undefined), '/');
});

test('the welcome screen is never a place to return to', () => {
  assert.equal(safeReturnUrl('/welkom'), '/');
  assert.equal(safeReturnUrl('/welkom?returnUrl=%2F'), '/');
  assert.equal(safeReturnUrl('/welkom/'), '/');
  assert.equal(safeReturnUrl('/welkomst'), '/welkomst');
});
