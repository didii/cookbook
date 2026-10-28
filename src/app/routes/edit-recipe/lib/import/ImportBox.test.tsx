import assert from 'node:assert/strict';
import { afterEach, describe, test, vi } from 'vitest';
import { act, fireEvent, render, screen } from '~testing/dom';
import { ImportBox } from './ImportBox';
import { emptyDraftSeed } from '../draft';

afterEach(() => vi.unstubAllGlobals());

const recipePage = `<html><head><script type="application/ld+json">${JSON.stringify({
  '@type': 'Recipe',
  name: 'Tomatensoep',
  recipeIngredient: ['500 g tomaten'],
  recipeInstructions: ['Kook de soep.'],
  image: 'https://example.com/soep.jpg',
})}</script></head></html>`;
const pageWithoutRecipe = '<html><body><p>Hallo</p></body></html>';

const html = (body: string, status = 200) => new Response(body, { status, headers: { 'Content-Type': 'text/html' } });

function setup(fetch: () => Promise<Response>) {
  const stub = vi.fn(fetch);
  vi.stubGlobal('fetch', stub);
  const onImported = vi.fn();
  render(<ImportBox base={{ ...emptyDraftSeed, author: 'Mam' }} onImported={onImported} />);
  return { stub, onImported };
}

const type = (address: string) => fireEvent.change(screen.getByTestId('ImportBox-address'), { target: { value: address } });
const submit = () => act(async () => void fireEvent.click(screen.getByTestId('ImportBox-button')));
const importAddress = async (address: string) => (type(address), submit());
const message = () => screen.getByTestId('ImportBox-message').textContent;

describe('recipe-import › Address that is not a web address', () => {
  for (const address of ['', 'soep', 'ftp://example.com/soep', 'javascript:alert(1)']) {
    test(`"${address}" gives a message and fetches nothing`, async () => {
      const { stub, onImported } = setup(async () => html(recipePage));
      await importAddress(address);
      assert.ok(message());
      assert.equal(stub.mock.calls.length, 0);
      assert.equal(onImported.mock.calls.length, 0);
    });
  }
});

describe('recipe-import › Page that cannot be fetched', () => {
  for (const [name, answer] of [
    ['a refused address', async () => new Response(null, { status: 403 })],
    ['a site that is down', async () => new Response(null, { status: 502 })],
    ['content that is not a page', async () => new Response(null, { status: 415 })],
    ['a network error', async () => Promise.reject(new TypeError('offline'))],
  ] as const) {
    test(`${name} gives a message and imports nothing`, async () => {
      const { onImported } = setup(answer);
      await importAddress('https://example.com/soep');
      assert.ok(message());
      assert.equal(onImported.mock.calls.length, 0);
    });
  }

  test('too many fetches give a message', async () => {
    setup(async () => new Response(null, { status: 429 }));
    await importAddress('https://example.com/soep');
    assert.ok(message());
  });
});

describe('recipe-import › Page without a recipe', () => {
  test('gives a message and imports nothing', async () => {
    const { onImported } = setup(async () => html(pageWithoutRecipe));
    await importAddress('https://example.com/nieuws');
    assert.ok(message());
    assert.equal(onImported.mock.calls.length, 0);
  });
});

describe('recipe-import › Import waits and can be repeated', () => {
  test('the button is disabled and says so while the import runs', async () => {
    setup(() => new Promise(() => undefined));
    const idle = screen.getByTestId('ImportBox-button').textContent;
    await importAddress('https://example.com/soep');
    const button = screen.getByTestId<HTMLButtonElement>('ImportBox-button');
    assert.equal(button.disabled, true);
    assert.notEqual(button.textContent, idle);
  });

  test('after a message the same address can be imported again', async () => {
    let answer = html(pageWithoutRecipe);
    const { stub, onImported } = setup(async () => answer);
    await importAddress('https://example.com/soep');
    assert.equal(screen.getByTestId<HTMLButtonElement>('ImportBox-button').disabled, false);
    answer = html(recipePage);
    await submit();
    assert.equal(stub.mock.calls.length, 2);
    assert.equal(onImported.mock.calls.length, 1);
  });

  test('the message is cleared when the import starts again', async () => {
    setup(() => new Promise(() => undefined));
    await importAddress('soep');
    assert.ok(message());
    type('https://example.com/soep');
    await submit();
    assert.equal(message(), '');
  });
});

describe('ImportBox', () => {
  test('posts the address as JSON to the page endpoint', async () => {
    const { stub } = setup(async () => html(recipePage));
    await importAddress(' https://example.com/soep ');
    const [url, init] = stub.mock.calls[0] as unknown as [string, RequestInit];
    assert.equal(url, '/importeren/pagina');
    assert.equal(init.method, 'POST');
    assert.deepEqual(JSON.parse(init.body as string), { url: 'https://example.com/soep' });
  });

  test('hands over the seed and the image address', async () => {
    const { onImported } = setup(async () => html(recipePage));
    await importAddress('https://example.com/soep');
    const [seed, imageUrl] = onImported.mock.calls[0];
    assert.equal(seed.title, 'Tomatensoep');
    assert.equal(seed.source, 'https://example.com/soep');
    assert.equal(seed.author, 'Mam');
    assert.equal(imageUrl, 'https://example.com/soep.jpg');
  });
});
