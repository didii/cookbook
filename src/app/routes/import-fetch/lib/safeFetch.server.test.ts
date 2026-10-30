import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { imageBytes, isHtml, isImage, maxRedirects, pageBytes, refusedAddress, safeFetch } from './safeFetch.server';

const html = (body = '<p>hi</p>', init: ResponseInit = {}) =>
  new Response(body, { headers: { 'Content-Type': 'text/html; charset=utf-8' }, ...init });
const redirect = (to: string, status = 302) => new Response(null, { status, headers: { Location: to } });

/** A fetch that answers from a list in order and records the addresses it was asked for. */
function script(...answers: (Response | ((signal: AbortSignal) => Promise<Response>))[]) {
  const asked: string[] = [];
  const fetch = (async (input: URL, init: RequestInit) => {
    asked.push(String(input));
    const answer = answers.shift() ?? html();
    return typeof answer === 'function' ? answer(init.signal as AbortSignal) : answer;
  }) as unknown as typeof globalThis.fetch;
  return { asked, fetch };
}

const page = (address: string, s = script()) => safeFetch(address, { maxBytes: pageBytes, accept: isHtml, fetch: s.fetch });

describe('recipe-import › Other schemes refused', () => {
  for (const address of ['ftp://example.com/a', 'file:///etc/passwd', 'javascript:alert(1)', 'data:text/html,hi']) {
    test(`${address} is refused and not fetched`, async () => {
      const s = script();
      assert.equal((await page(address, s)).ok, false);
      assert.deepEqual(s.asked, []);
    });
  }

  test('an address that does not parse is a bad request', async () => {
    assert.deepEqual(await page('not an address'), { ok: false, status: 400 });
  });
});

describe('recipe-import › Local and private addresses refused', () => {
  const refused = [
    'http://localhost/',
    'http://LOCALHOST./',
    'http://printer.local/',
    'http://db.internal/',
    'http://127.0.0.1/',
    'http://127.1/',
    'http://0x7f.1/',
    'http://2130706433/',
    'http://0/',
    'http://10.0.0.5/',
    'http://100.64.0.1/',
    'http://169.254.169.254/latest/meta-data',
    'http://172.16.0.1/',
    'http://172.31.255.255/',
    'http://192.168.1.1/',
    'http://224.0.0.1/',
    'http://255.255.255.255/',
    'http://[::1]/',
    'http://[::]/',
    'http://[fc00::1]/',
    'http://[fd12:3456::1]/',
    'http://[fe80::1]/',
    'http://[ff02::1]/',
    'http://[::ffff:127.0.0.1]/',
    'http://[::ffff:10.0.0.1]/',
    'http://[64:ff9b::7f00:1]/',
    'http://[2002:7f00:1::]/',
  ];
  for (const address of refused) {
    test(`${address} is refused and not fetched`, async () => {
      const s = script();
      assert.deepEqual(await page(address, s), { ok: false, status: 403 });
      assert.deepEqual(s.asked, []);
    });
  }

  for (const address of ['http://example.com/', 'https://8.8.8.8/', 'http://172.32.0.1/', 'http://[2606:4700::1111]/', 'http://[::ffff:8.8.8.8]/']) {
    test(`${address} is allowed`, () => {
      assert.equal(refusedAddress(new URL(address)), false);
    });
  }
});

describe('recipe-import › Address with credentials refused', () => {
  for (const address of ['https://user:pass@example.com/', 'https://user@example.com/']) {
    test(`${address} is refused and not fetched`, async () => {
      const s = script();
      assert.deepEqual(await page(address, s), { ok: false, status: 403 });
      assert.deepEqual(s.asked, []);
    });
  }
});

describe('recipe-import › Redirect to a refused address', () => {
  test('is not followed', async () => {
    const s = script(redirect('http://169.254.169.254/'));
    assert.deepEqual(await page('https://example.com/', s), { ok: false, status: 403 });
    assert.deepEqual(s.asked, ['https://example.com/']);
  });

  test('a relative redirect to a good address is followed', async () => {
    const s = script(redirect('/other'), html('ok'));
    const result = await page('https://example.com/a', s);
    assert.equal(result.ok, true);
    assert.deepEqual(s.asked, ['https://example.com/a', 'https://example.com/other']);
  });
});

describe('recipe-import › Too many redirects', () => {
  test('a sixth redirect is refused', async () => {
    const s = script(...Array.from({ length: maxRedirects + 1 }, (_, i) => redirect(`/${i}`)));
    assert.equal((await page('https://example.com/', s)).ok, false);
    assert.equal(s.asked.length, maxRedirects + 1);
  });

  test('five redirects are followed', async () => {
    const s = script(...Array.from({ length: maxRedirects }, (_, i) => redirect(`/${i}`)), html('end'));
    assert.equal((await page('https://example.com/', s)).ok, true);
  });
});

describe('recipe-import › Response too large', () => {
  test('a stream over the cap is refused whatever it declares', async () => {
    const big = new Response(new Uint8Array(pageBytes + 1), { headers: { 'Content-Type': 'text/html', 'Content-Length': '10' } });
    assert.deepEqual(await page('https://example.com/', script(big)), { ok: false, status: 413 });
  });

  test('a declared length over the cap is refused', async () => {
    const big = html('x', { headers: { 'Content-Type': 'text/html', 'Content-Length': String(pageBytes + 1) } });
    assert.deepEqual(await page('https://example.com/', script(big)), { ok: false, status: 413 });
  });

  test('an image is capped lower than a page', async () => {
    const png = new Response(new Uint8Array(imageBytes + 1), { headers: { 'Content-Type': 'image/png' } });
    const result = await safeFetch('https://example.com/a.png', { maxBytes: imageBytes, accept: isImage, fetch: script(png).fetch });
    assert.deepEqual(result, { ok: false, status: 413 });
  });

  test('a body exactly at the cap is returned', async () => {
    const edge = new Response(new Uint8Array(pageBytes), { headers: { 'Content-Type': 'text/html' } });
    const result = await page('https://example.com/', script(edge));
    assert.equal(result.ok && result.body.byteLength, pageBytes);
  });
});

describe('recipe-import › Slow site', () => {
  test('is refused after the timeout', async () => {
    const hang = (signal: AbortSignal) => new Promise<Response>((_, reject) => signal.addEventListener('abort', () => reject(new Error('aborted'))));
    const result = await safeFetch('https://example.com/', { maxBytes: pageBytes, accept: isHtml, fetch: script(hang).fetch, timeoutMs: 20 });
    assert.deepEqual(result, { ok: false, status: 504 });
  });
});

describe('recipe-import › Wrong kind of content', () => {
  test('a page endpoint refuses an image', async () => {
    const png = new Response(new Uint8Array([1]), { headers: { 'Content-Type': 'image/png' } });
    assert.deepEqual(await page('https://example.com/', script(png)), { ok: false, status: 415 });
  });

  test('an image endpoint refuses html', async () => {
    const result = await safeFetch('https://example.com/', { maxBytes: imageBytes, accept: isImage, fetch: script(html()).fetch });
    assert.deepEqual(result, { ok: false, status: 415 });
  });

  test('an image endpoint refuses a gif', async () => {
    const gif = new Response(new Uint8Array([1]), { headers: { 'Content-Type': 'image/gif' } });
    const result = await safeFetch('https://example.com/', { maxBytes: imageBytes, accept: isImage, fetch: script(gif).fetch });
    assert.deepEqual(result, { ok: false, status: 415 });
  });
});

describe('safeFetch', () => {
  test('returns the body and the media type', async () => {
    const result = await page('https://example.com/', script(html('<p>hi</p>')));
    assert.equal(result.ok && new TextDecoder().decode(result.body), '<p>hi</p>');
    assert.equal(result.ok && result.contentType, 'text/html');
  });

  test('a site error is a bad gateway', async () => {
    const notFound = new Response('no', { status: 404, headers: { 'Content-Type': 'text/html' } });
    assert.deepEqual(await page('https://example.com/', script(notFound)), { ok: false, status: 502 });
  });

  test('a network error is a bad gateway', async () => {
    const fetch = (async () => {
      throw new Error('down');
    }) as unknown as typeof globalThis.fetch;
    assert.deepEqual(await safeFetch('https://example.com/', { maxBytes: pageBytes, accept: isHtml, fetch }), { ok: false, status: 502 });
  });

  test('follows redirects by hand', async () => {
    const seen: (RequestRedirect | undefined)[] = [];
    const fetch = (async (_: URL, init: RequestInit) => (seen.push(init.redirect), html())) as unknown as typeof globalThis.fetch;
    await safeFetch('https://example.com/', { maxBytes: pageBytes, accept: isHtml, fetch });
    assert.deepEqual(seen, ['manual']);
  });
});
