import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { sourceLink } from './sourceLink';

describe('sourceLink', () => {
  test('an https address is a link with its host as text', () => {
    assert.deepEqual(sourceLink('https://www.smulweb.nl/recepten/123/appeltaart'), {
      href: 'https://www.smulweb.nl/recepten/123/appeltaart',
      text: 'smulweb.nl',
    });
  });

  test('an http address is a link', () => {
    assert.deepEqual(sourceLink('http://example.com/x'), { href: 'http://example.com/x', text: 'example.com' });
  });

  test('surrounding whitespace is ignored', () => {
    assert.equal(sourceLink('  https://example.com  ')?.href, 'https://example.com');
  });

  for (const source of ['javascript:alert(1)', 'ftp://example.com/x', 'zie https://example.com', 'https://exa mple.com', 'Libelle', '', 'https://'])
    test(`"${source}" is not a link`, () => {
      assert.equal(sourceLink(source), undefined);
    });
});
