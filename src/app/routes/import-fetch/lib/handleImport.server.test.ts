import assert from 'node:assert/strict';
import { RouterContextProvider } from 'react-router';
import { afterEach, describe, test, vi } from 'vitest';
import { importAllowContext, userEmailContext } from '~app/shared/context.server';
import { fakeRateLimit } from '~testing/rateLimit';
import { handleImport, maxAddressLength } from './handleImport.server';
import { isHtml, pageBytes } from './safeFetch.server';

afterEach(() => vi.unstubAllGlobals());

const stubFetch = () => {
  const fetch = vi.fn(async () => new Response('<p>hi</p>', { headers: { 'Content-Type': 'text/html' } }));
  vi.stubGlobal('fetch', fetch);
  return fetch;
};

const contextFor = (email: string, allow = fakeRateLimit().allow) => {
  const context = new RouterContextProvider();
  context.set(userEmailContext, email);
  context.set(importAllowContext, allow);
  return context;
};

const post = (body: unknown, context = contextFor('mum@example.com')) =>
  handleImport(
    new Request('http://localhost/importeren/pagina', { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body) }),
    context,
    {
      maxBytes: pageBytes,
      accept: isHtml,
    },
  );

describe('recipe-import › Request body is checked', () => {
  const bad: [string, unknown][] = [
    ['no address', {}],
    ['an empty address', { url: '' }],
    ['an address that is not a string', { url: 5 }],
    ['more than one address', { url: 'https://a.example/', other: 'https://b.example/' }],
    ['a list of addresses', { url: ['https://a.example/', 'https://b.example/'] }],
    ['a list instead of an object', ['https://a.example/']],
    ['an address that is too long', { url: `https://example.com/${'a'.repeat(maxAddressLength)}` }],
    ['no JSON', 'url=https://example.com/'],
    ['null', 'null'],
  ];
  for (const [name, body] of bad) {
    test(`${name} is refused without fetching`, async () => {
      const fetch = stubFetch();
      assert.equal((await post(body)).status, 400);
      assert.equal(fetch.mock.calls.length, 0);
    });
  }

  test('an address of 2,000 characters is fetched', async () => {
    stubFetch();
    const url = `https://example.com/${'a'.repeat(maxAddressLength - 'https://example.com/'.length)}`;
    assert.equal((await post({ url })).status, 200);
  });
});

describe('recipe-import › Limit reached', () => {
  test('the 31st fetch in the window is refused with 429 and a wait hint', async () => {
    stubFetch();
    const context = contextFor('mum@example.com');
    for (let i = 0; i < 30; i++) assert.equal((await post({ url: 'https://example.com/' }, context)).status, 200);
    const refused = await post({ url: 'https://example.com/' }, context);
    assert.equal(refused.status, 429);
    assert.equal(refused.headers.get('Retry-After'), '60');
  });

  test('a refused request fetches nothing', async () => {
    const fetch = stubFetch();
    const response = await post(
      { url: 'https://example.com/' },
      contextFor('mum@example.com', async () => false),
    );
    assert.equal(response.status, 429);
    assert.equal(fetch.mock.calls.length, 0);
  });

  test('requests are served again after the window', async () => {
    stubFetch();
    const limit = fakeRateLimit(1);
    const context = contextFor('mum@example.com', limit.allow);
    await post({ url: 'https://example.com/' }, context);
    assert.equal((await post({ url: 'https://example.com/' }, context)).status, 429);
    limit.reset();
    assert.equal((await post({ url: 'https://example.com/' }, context)).status, 200);
  });
});

describe('recipe-import › Limits are per family member', () => {
  test('another member is still served when one has reached the limit', async () => {
    stubFetch();
    const limit = fakeRateLimit(1);
    await post({ url: 'https://example.com/' }, contextFor('mum@example.com', limit.allow));
    assert.equal((await post({ url: 'https://example.com/' }, contextFor('mum@example.com', limit.allow))).status, 429);
    assert.equal((await post({ url: 'https://example.com/' }, contextFor('dad@example.com', limit.allow))).status, 200);
  });
});

describe('handleImport', () => {
  test('answers the bytes with their media type', async () => {
    stubFetch();
    const response = await post({ url: 'https://example.com/' });
    assert.equal(await response.text(), '<p>hi</p>');
    assert.equal(response.headers.get('Content-Type'), 'text/html');
  });

  test('sandboxes and never sniffs what it hands back', async () => {
    stubFetch();
    const response = await post({ url: 'https://example.com/' });
    assert.equal(response.headers.get('Content-Security-Policy'), 'sandbox');
    assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff');
  });

  test('passes on the status of a refused fetch without a body', async () => {
    stubFetch();
    const response = await post({ url: 'http://localhost/' });
    assert.equal(response.status, 403);
    assert.equal(await response.text(), '');
  });
});
