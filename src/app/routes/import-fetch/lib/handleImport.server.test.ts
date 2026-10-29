import assert from 'node:assert/strict';
import { RouterContextProvider } from 'react-router';
import { afterEach, describe, test, vi } from 'vitest';
import { importAllowContext, userEmailContext } from '~app/shared/context.server';
import { handleImport, maxAddressLength } from './handleImport.server';
import { isHtml, pageBytes } from './safeFetch.server';

afterEach(() => vi.unstubAllGlobals());

const stubFetch = () => {
  const fetch = vi.fn(async () => new Response('<p>hi</p>', { headers: { 'Content-Type': 'text/html' } }));
  vi.stubGlobal('fetch', fetch);
  return fetch;
};

const contextFor = (email: string, allow: (key: string) => Promise<boolean> = async () => true) => {
  const context = new RouterContextProvider();
  context.set(userEmailContext, email);
  context.set(importAllowContext, allow);
  return context;
};

const post = (body: unknown, context = contextFor('mum@example.com')) =>
  handleImport(
    new Request('http://localhost/importeren/pagina', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
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

// The limit itself (30 per 60 s) is the binding in wrangler.jsonc, not code of ours. What this unit owns: it asks per member and refuses when told no.
describe('handleImport content type', () => {
  const asText = (contentType?: string) =>
    handleImport(
      new Request('http://localhost/importeren/pagina', {
        method: 'POST',
        headers: contentType ? { 'Content-Type': contentType } : {},
        body: '{"url":"https://example.com/"}',
      }),
      contextFor('mum@example.com'),
      { maxBytes: pageBytes, accept: isHtml },
    );

  // A form on another site can post text/plain without a preflight, with a body that parses as JSON.
  test('a text/plain body is refused with 415 and fetches nothing', async () => {
    const fetch = stubFetch();
    assert.equal((await asText('text/plain;charset=UTF-8')).status, 415);
    assert.equal(fetch.mock.calls.length, 0);
  });

  test('a form-encoded body is refused with 415', async () => {
    stubFetch();
    assert.equal((await asText('application/x-www-form-urlencoded')).status, 415);
  });

  test('a body without a content type is refused with 415', async () => {
    stubFetch();
    assert.equal((await asText()).status, 415);
  });

  test('application/json with a charset is accepted', async () => {
    stubFetch();
    assert.equal((await asText('application/json; charset=utf-8')).status, 200);
  });
});

describe('recipe-import › Limit reached', () => {
  test('a refused request answers 429 with a wait hint', async () => {
    stubFetch();
    const refused = await post(
      { url: 'https://example.com/' },
      contextFor('mum@example.com', async () => false),
    );
    assert.equal(refused.status, 429);
    assert.equal(refused.headers.get('Retry-After'), '60');
  });

  test('a refused request fetches nothing', async () => {
    const fetch = stubFetch();
    await post(
      { url: 'https://example.com/' },
      contextFor('mum@example.com', async () => false),
    );
    assert.equal(fetch.mock.calls.length, 0);
  });

  test('an allowed request is served', async () => {
    stubFetch();
    assert.equal(
      (
        await post(
          { url: 'https://example.com/' },
          contextFor('mum@example.com', async () => true),
        )
      ).status,
      200,
    );
  });

  test('every request counts, also one with a bad body', async () => {
    const asked: string[] = [];
    await post(
      {},
      contextFor('mum@example.com', async (key) => (asked.push(key), true)),
    );
    assert.deepEqual(asked, ['mum@example.com']);
  });
});

describe('recipe-import › Limits are per family member', () => {
  test('the limit is asked for the email of the member who asks', async () => {
    stubFetch();
    const asked: string[] = [];
    const allow = async (key: string) => (asked.push(key), true);
    await post({ url: 'https://example.com/' }, contextFor('mum@example.com', allow));
    await post({ url: 'https://example.com/' }, contextFor('dad@example.com', allow));
    assert.deepEqual(asked, ['mum@example.com', 'dad@example.com']);
  });

  test('a member who is refused does not stop another member', async () => {
    stubFetch();
    const allow = async (key: string) => key !== 'mum@example.com';
    assert.equal((await post({ url: 'https://example.com/' }, contextFor('mum@example.com', allow))).status, 429);
    assert.equal((await post({ url: 'https://example.com/' }, contextFor('dad@example.com', allow))).status, 200);
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
