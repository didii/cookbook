import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { contentSecurityPolicy, createNonce } from './entry.server';

const directives = (policy: string) => Object.fromEntries(policy.split('; ').map((d) => [d.split(' ')[0], d.split(' ').slice(1)]));

describe('security-headers › Page has the policy', () => {
  test('has exactly the directives of the spec', () => {
    assert.deepEqual(directives(contentSecurityPolicy('abc')), {
      'default-src': [`'self'`],
      'script-src': [`'self'`, `'nonce-abc'`],
      'style-src': [`'self'`, `'unsafe-inline'`, 'https://fonts.googleapis.com'],
      'font-src': ['https://fonts.gstatic.com'],
      'img-src': [`'self'`, 'data:', 'blob:'],
      'connect-src': [`'self'`],
      'manifest-src': [`'self'`],
      'worker-src': [`'self'`],
      'object-src': [`'none'`],
      'base-uri': [`'self'`],
      'form-action': [`'self'`],
      'frame-ancestors': [`'none'`],
    });
  });
});

describe('security-headers › Nonce differs per response', () => {
  test('two nonces differ', () => {
    assert.notEqual(createNonce(), createNonce());
  });

  test('a nonce is base64 of at least 128 bits', () => {
    assert.equal(atob(createNonce()).length >= 16, true);
  });
});

describe('security-headers › No unsafe script sources', () => {
  const policy = directives(contentSecurityPolicy('abc'));

  test('script-src has neither unsafe-inline nor unsafe-eval', () => {
    assert.deepEqual(policy['script-src'].filter((s) => s === `'unsafe-inline'` || s === `'unsafe-eval'`), []);
  });

  test('no directive has unsafe-eval', () => {
    assert.equal(contentSecurityPolicy('abc').includes(`'unsafe-eval'`), false);
  });
});

describe('security-headers › The app cannot be framed', () => {
  test('the policy has frame-ancestors none', () => {
    assert.ok(contentSecurityPolicy('abc').split('; ').includes(`frame-ancestors 'none'`));
  });
});
