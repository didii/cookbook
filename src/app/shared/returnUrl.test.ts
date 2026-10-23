import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { safeReturnUrl } from './returnUrl';

describe('safeReturnUrl', () => {
  describe('a path of this site', () => {
    for (const path of ['/recepten/soep', '/?q=soep&sort=az', '/recepten/soep?x=%2F%2Fevil.test#stap']) {
      test(`${JSON.stringify(path)} is kept, with its query`, () => {
        assert.equal(safeReturnUrl(path), path);
      });
    }
  });

  describe('anything that could leave the site goes home', () => {
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
      test(`${JSON.stringify(bad)} goes home`, () => {
        assert.equal(safeReturnUrl(bad), '/');
      });

    test('null goes home', () => {
      assert.equal(safeReturnUrl(null), '/');
    });

    test('undefined goes home', () => {
      assert.equal(safeReturnUrl(undefined), '/');
    });
  });

  describe('the welcome screen is never a place to return to', () => {
    for (const path of ['/welkom', '/welkom?returnUrl=%2F', '/welkom/', '/Welkom'])
      test(`${path} goes home`, () => {
        assert.equal(safeReturnUrl(path), '/');
      });

    test('a path that only starts like it is kept', () => {
      assert.equal(safeReturnUrl('/welkomst'), '/welkomst');
    });
  });
});
