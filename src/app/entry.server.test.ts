import assert from 'node:assert/strict';
import { createRequestHandler, type ServerBuild } from 'react-router';
import { describe, test } from 'vitest';
import '~testing/dom';
import * as entry from './entry.server';
import { contentSecurityPolicy, createNonce } from './entry.server';
import * as root from './root';

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
    assert.deepEqual(
      policy['script-src'].filter((s) => s === `'unsafe-inline'` || s === `'unsafe-eval'`),
      [],
    );
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

const build = {
  entry: { module: entry },
  routes: { root: { id: 'root', path: '', module: { default: () => null, Layout: root.Layout } } },
  assets: {
    entry: { imports: [], module: '/entry.js' },
    routes: {
      root: {
        id: 'root',
        module: '/root.js',
        imports: [],
        hasAction: false,
        hasLoader: false,
        hasClientAction: false,
        hasClientLoader: false,
        hasClientMiddleware: false,
        hasErrorBoundary: false,
      },
    },
    url: '/manifest.js',
    version: '1',
  },
  basename: '/',
  publicPath: '/',
  assetsBuildDirectory: 'build/client',
  future: {},
  ssr: true,
  isSpaMode: false,
  prerender: [],
  routeDiscovery: { mode: 'initial' },
} as unknown as ServerBuild;

describe('security-headers › Inline scripts carry the nonce', () => {
  const page = async () => {
    const res = await createRequestHandler(build, 'test')(new Request('https://cookbook.example.com/'));
    return { policy: res.headers.get('Content-Security-Policy') ?? '', html: await res.text() };
  };

  test('every inline script has the nonce of the policy', async () => {
    const { policy, html } = await page();
    const nonce = /'nonce-([^']+)'/.exec(policy)?.[1];
    assert.ok(nonce);
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const inline = [...doc.scripts].filter((s) => !s.src);
    assert.ok(inline.length > 0);
    assert.deepEqual(
      inline.filter((s) => s.getAttribute('nonce') !== nonce),
      [],
    );
  });
});

// Not automated: needs a real browser.
test.todo('security-headers › The page still works under the policy');
