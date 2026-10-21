import assert from 'node:assert/strict';
import { afterEach, beforeEach, mock, test } from 'node:test';
import { act, fireEvent, render, screen } from '~testing/dom';
import { useNote } from './useNote';

const realFetch = globalThis.fetch;
let sent: { url: string; body: string; keepalive: boolean | undefined }[];
let status: number | 'offline';

beforeEach(() => {
  sent = [];
  status = 204;
  mock.timers.enable({ apis: ['setTimeout'] });
  globalThis.fetch = ((url: string, init: RequestInit) => {
    sent.push({ url, body: String(init.body), keepalive: init.keepalive });
    return status === 'offline' ? Promise.reject(new TypeError('offline')) : Promise.resolve(new Response(null, { status }));
  }) as typeof fetch;
});
afterEach(() => {
  mock.timers.reset();
  globalThis.fetch = realFetch;
});

/** The hook shown in the DOM: its state as text, its functions as buttons and a field. */
function Harness({ saved = 'oud', narrow = false }: { saved?: string; narrow?: boolean }) {
  const note = useNote('soep', saved, narrow);
  return (
    <div>
      <textarea data-testid="field" value={note.text} onChange={(e) => note.change(e.target.value)} />
      <output data-testid="state">
        {JSON.stringify({ open: note.isOpen, failed: note.failed, savedSinceOpen: note.savedSinceOpen, cue: note.cue })}
      </output>
      <button data-testid="open" aria-label="open" onClick={note.open} />
      <button data-testid="dismiss" aria-label="dismiss" onClick={note.dismiss} />
      <button data-testid="blur" aria-label="blur" onClick={note.blur} />
      <button data-testid="clear-cue" aria-label="clear-cue" onClick={note.clearCue} />
      <button data-testid="end-cue" aria-label="end-cue" onClick={note.endCue} />
    </div>
  );
}
const state = () => JSON.parse(screen.getByTestId('state').textContent!) as { open: boolean; failed: boolean; savedSinceOpen: boolean; cue: string };
const press = (id: string) => act(async () => void fireEvent.click(screen.getByTestId(id)));
const type = (value: string) => act(async () => void fireEvent.change(screen.getByTestId('field'), { target: { value } }));
const wait = (ms: number) => act(async () => mock.timers.tick(ms));

test('recipe-note › Unchanged note is not stored', async () => {
  render(<Harness narrow />);
  await press('open');
  await press('dismiss');
  await wait(10_000);
  assert.equal(sent.length, 0);
  assert.equal(state().cue, 'off');
});

test('dismissing a changed note stores it as typed', async () => {
  render(<Harness narrow />);
  await press('open');
  await type('nieuw ');
  await press('dismiss');
  assert.deepEqual(sent, [{ url: '/recepten/soep/notitie', body: 'note=nieuw+', keepalive: true }]);
});

test('recipe-note › Autosave after a pause', async () => {
  render(<Harness />);
  await type('nieuw');
  await wait(1999);
  assert.equal(sent.length, 0);
  await wait(1);
  assert.equal(sent.length, 1);
});

test('recipe-note › Typing restarts the pause', async () => {
  render(<Harness />);
  await type('a');
  await wait(1500);
  await type('ab');
  await wait(1500);
  assert.equal(sent.length, 0);
  await wait(500);
  assert.deepEqual(
    sent.map((s) => s.body),
    ['note=ab'],
  );
});

test('recipe-note › Autosave waits longer on a narrow screen', async () => {
  render(<Harness narrow />);
  await press('open');
  await type('nieuw');
  await wait(2000);
  assert.equal(sent.length, 0);
  await wait(3000);
  assert.equal(sent.length, 1);
});

test('recipe-note › Dismissing replaces a waiting save', async () => {
  render(<Harness narrow />);
  await press('open');
  await type('nieuw');
  await wait(1000);
  await press('dismiss');
  assert.equal(sent.length, 1);
  await wait(10_000);
  assert.equal(sent.length, 1);
});

test('blurring a changed note stores it and shows the cue on a wide screen', async () => {
  render(<Harness />);
  await type('nieuw');
  await press('blur');
  assert.equal(sent.length, 1);
  assert.equal(state().cue, 'shown');
});

test('recipe-note › Cue after a change', async () => {
  render(<Harness narrow />);
  await press('open');
  await type('nieuw');
  await press('dismiss');
  assert.equal(state().cue, 'shown');
});

test('recipe-note › No cue without a change', async () => {
  render(<Harness />);
  await press('blur');
  assert.equal(state().cue, 'off');
});

test('recipe-note › Saving while open shows no cue after dismissing', async () => {
  render(<Harness narrow />);
  await press('open');
  await type('nieuw');
  await wait(5000);
  // Stored while open: the field says so, the toast stays away, and closing saves nothing more.
  assert.deepEqual(state(), { open: true, failed: false, savedSinceOpen: true, cue: 'off' });
  await press('dismiss');
  assert.equal(sent.length, 1);
  assert.equal(state().cue, 'off');
});

test('recipe-note › Cue fades out', async () => {
  render(<Harness />);
  await type('nieuw');
  await press('blur');
  await wait(2999);
  assert.equal(state().cue, 'shown');
  await wait(1);
  assert.equal(state().cue, 'fading');
  await press('end-cue');
  assert.equal(state().cue, 'off');
});

test('with reduced motion the cue disappears without fading', async () => {
  const query = window.matchMedia;
  window.matchMedia = ((q: string) => ({ ...query(q), matches: q.includes('reduce') })) as typeof window.matchMedia;
  try {
    render(<Harness />);
    await type('nieuw');
    await press('blur');
    await wait(3000);
    assert.equal(state().cue, 'off');
  } finally {
    window.matchMedia = query;
  }
});

test('recipe-note › Tapping the cue removes it', async () => {
  render(<Harness />);
  await type('nieuw');
  await press('blur');
  await press('clear-cue');
  assert.equal(state().cue, 'off');
});

test('recipe-note › Note cannot be saved', async () => {
  status = 500;
  render(<Harness narrow />);
  await press('open');
  await type('nieuw');
  await press('dismiss');
  assert.deepEqual(state(), { open: true, failed: true, savedSinceOpen: false, cue: 'off' });
  assert.equal((screen.getByTestId('field') as HTMLTextAreaElement).value, 'nieuw');
  // The next try stores it.
  status = 204;
  await press('dismiss');
  assert.equal(sent.length, 2);
  assert.deepEqual(state(), { open: false, failed: false, savedSinceOpen: true, cue: 'shown' });
});

test('a request that never arrives counts as a failed save', async () => {
  status = 'offline';
  render(<Harness />);
  await type('nieuw');
  await press('blur');
  assert.equal(state().failed, true);
  assert.equal(state().cue, 'off');
});

test('typing after a save keeps the hint away from "saved" and is stored next', async () => {
  render(<Harness narrow />);
  await press('open');
  await type('een');
  await wait(5000);
  assert.equal(state().savedSinceOpen, true);
  await type('twee');
  assert.equal(state().savedSinceOpen, false);
});

test('leaving the page stores a changed note with a keepalive request', async () => {
  render(<Harness />);
  await type('nieuw');
  await act(async () => void window.dispatchEvent(new Event('pagehide')));
  assert.equal(sent.length, 1);
  assert.equal(sent[0]!.keepalive, true);
});
