import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { act, fireEvent, render, screen } from '~testing/dom';
import { NotePanel } from './NotePanel';
import { useNote } from './useNote';

const realFetch = globalThis.fetch;
let sent: string[];
let status: number;
beforeEach(() => {
  sent = [];
  status = 204;
  globalThis.fetch = ((_url: string, init: RequestInit) => {
    sent.push(String(init.body));
    return Promise.resolve(new Response(null, { status }));
  }) as typeof fetch;
});
afterEach(() => {
  globalThis.fetch = realFetch;
});

function Panel() {
  return <NotePanel note={useNote('soep', 'oud', false)} />;
}
const field = () => screen.getByTestId<HTMLTextAreaElement>('NotePanel-field');
const type = (value: string) => act(async () => void fireEvent.change(field(), { target: { value } }));
const leave = () => act(async () => void fireEvent.blur(field()));

test('recipe-note › Note panel on a wide screen', () => {
  render(<Panel />);
  assert.equal(field().value, 'oud');
  assert.ok(screen.getByText('Alleen voor jou'));
  assert.equal(screen.queryByRole('button', { name: /notitie/i }), null);
  // Shown from 52rem only.
  assert.ok(screen.getByTestId('NotePanel-panel').classList.contains('max-[51.99rem]:hidden'));
});

test('recipe-note › Leaving the field saves', async () => {
  render(<Panel />);
  await type('nieuw');
  await leave();
  assert.deepEqual(sent, ['note=nieuw']);
  assert.equal(screen.getByTestId('NoteCue-cue').textContent?.trim(), 'Notitie bewaard');
});

test('leaving the field without a change stores nothing and shows no cue', async () => {
  render(<Panel />);
  await leave();
  assert.deepEqual(sent, []);
  assert.equal(screen.queryByTestId('NoteCue-cue'), null);
});

test('recipe-note › Wide save failure shows a message', async () => {
  status = 500;
  render(<Panel />);
  await type('nieuw');
  await leave();
  assert.ok(screen.getByTestId('NotePanel-failed').textContent?.includes('niet bewaard'));
  assert.equal(field().value, 'nieuw');
  assert.equal(screen.queryByTestId('NoteCue-cue'), null);
});
