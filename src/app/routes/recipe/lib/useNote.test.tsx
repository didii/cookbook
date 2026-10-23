import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, mock, test } from 'node:test';
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

describe('recipe-note › Unchanged note is not stored', () => {
  beforeEach(async () => {
    render(<Harness narrow />);
    await press('open');
    await press('dismiss');
    await wait(10_000);
  });

  test('nothing is sent', () => {
    assert.equal(sent.length, 0);
  });

  test('no cue is shown', () => {
    assert.equal(state().cue, 'off');
  });
});

describe('useNote', () => {
  test('dismissing a changed note stores it as typed', async () => {
    render(<Harness narrow />);
    await press('open');
    await type('nieuw ');
    await press('dismiss');
    assert.deepEqual(sent, [{ url: '/recepten/soep/notitie', body: 'note=nieuw+', keepalive: true }]);
  });

  test('blurring a changed note stores it and shows the cue on a wide screen', async () => {
    render(<Harness />);
    await type('nieuw');
    await press('blur');
    assert.equal(sent.length, 1);
    assert.equal(state().cue, 'shown');
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
});

describe('recipe-note › Autosave after a pause', () => {
  beforeEach(async () => {
    render(<Harness />);
    await type('nieuw');
  });

  test('nothing is sent just before the pause ends', async () => {
    await wait(1999);
    assert.equal(sent.length, 0);
  });

  test('the note is sent when the pause ends', async () => {
    await wait(2000);
    assert.equal(sent.length, 1);
  });
});

describe('recipe-note › Typing restarts the pause', () => {
  beforeEach(async () => {
    render(<Harness />);
    await type('a');
    await wait(1500);
    await type('ab');
    await wait(1500);
  });

  test('nothing is sent 3 seconds after the first key', () => {
    assert.equal(sent.length, 0);
  });

  test('the latest text is sent after the new pause', async () => {
    await wait(500);
    assert.deepEqual(
      sent.map((s) => s.body),
      ['note=ab'],
    );
  });
});

describe('recipe-note › Autosave waits longer on a narrow screen', () => {
  beforeEach(async () => {
    render(<Harness narrow />);
    await press('open');
    await type('nieuw');
  });

  test('nothing is sent after the wide pause', async () => {
    await wait(2000);
    assert.equal(sent.length, 0);
  });

  test('the note is sent after the narrow pause', async () => {
    await wait(5000);
    assert.equal(sent.length, 1);
  });
});

describe('recipe-note › Dismissing replaces a waiting save', () => {
  beforeEach(async () => {
    render(<Harness narrow />);
    await press('open');
    await type('nieuw');
    await wait(1000);
    await press('dismiss');
  });

  test('dismissing sends the note at once', () => {
    assert.equal(sent.length, 1);
  });

  test('the waiting save does not send it again', async () => {
    await wait(10_000);
    assert.equal(sent.length, 1);
  });
});

describe('recipe-note › Cue after a change', () => {
  test('dismissing a changed note shows the cue', async () => {
    render(<Harness narrow />);
    await press('open');
    await type('nieuw');
    await press('dismiss');
    assert.equal(state().cue, 'shown');
  });
});

describe('recipe-note › No cue without a change', () => {
  test('blurring an unchanged note shows no cue', async () => {
    render(<Harness />);
    await press('blur');
    assert.equal(state().cue, 'off');
  });
});

describe('recipe-note › Saving while open shows no cue after dismissing', () => {
  beforeEach(async () => {
    render(<Harness narrow />);
    await press('open');
    await type('nieuw');
    await wait(5000);
  });

  test('while open, the field says it is saved and no cue shows', () => {
    // Stored while open: the field says so, the toast stays away.
    assert.deepEqual(state(), { open: true, failed: false, savedSinceOpen: true, cue: 'off' });
  });

  test('closing saves nothing more', async () => {
    await press('dismiss');
    assert.equal(sent.length, 1);
  });

  test('closing shows no cue', async () => {
    await press('dismiss');
    assert.equal(state().cue, 'off');
  });
});

describe('recipe-note › Cue fades out', () => {
  beforeEach(async () => {
    render(<Harness />);
    await type('nieuw');
    await press('blur');
  });

  test('the cue is shown just before 3 seconds', async () => {
    await wait(2999);
    assert.equal(state().cue, 'shown');
  });

  test('the cue fades after 3 seconds', async () => {
    await wait(3000);
    assert.equal(state().cue, 'fading');
  });

  test('the cue is gone when the fade ends', async () => {
    await wait(3000);
    await press('end-cue');
    assert.equal(state().cue, 'off');
  });
});

describe('recipe-note › Tapping the cue removes it', () => {
  test('the cue is off after clearing it', async () => {
    render(<Harness />);
    await type('nieuw');
    await press('blur');
    await press('clear-cue');
    assert.equal(state().cue, 'off');
  });
});

describe('recipe-note › Note cannot be saved', () => {
  beforeEach(async () => {
    status = 500;
    render(<Harness narrow />);
    await press('open');
    await type('nieuw');
    await press('dismiss');
  });

  test('the field stays open and shows the failure', () => {
    assert.deepEqual(state(), { open: true, failed: true, savedSinceOpen: false, cue: 'off' });
  });

  test('the typed text stays in the field', () => {
    assert.equal((screen.getByTestId('field') as HTMLTextAreaElement).value, 'nieuw');
  });

  test('the next try stores it', async () => {
    status = 204;
    await press('dismiss');
    assert.equal(sent.length, 2);
    assert.deepEqual(state(), { open: false, failed: false, savedSinceOpen: true, cue: 'shown' });
  });
});

describe('recipe-note › Leaving while a save is under way', () => {
  test('the newer text is sent with a keepalive request next to the one under way', async () => {
    let release!: () => void;
    globalThis.fetch = ((url: string, init: RequestInit) => {
      sent.push({ url, body: String(init.body), keepalive: init.keepalive });
      return sent.length === 1
        ? new Promise<Response>((r) => (release = () => r(new Response(null, { status: 204 }))))
        : Promise.resolve(new Response(null, { status: 204 }));
    }) as typeof fetch;
    render(<Harness />);
    await type('een');
    await press('blur');
    await type('een twee');
    await act(async () => void window.dispatchEvent(new Event('pagehide')));
    assert.deepEqual(
      sent.map((s) => s.body),
      ['note=een', 'note=een+twee'],
    );
    assert.ok(sent.every((s) => s.keepalive));
    release();
  });
});

describe('recipe-note › Failed note can be abandoned', () => {
  beforeEach(async () => {
    status = 500;
    render(<Harness narrow />);
    await press('open');
    await type('nieuw');
    await press('dismiss');
  });

  test('the first dismiss keeps the field open', () => {
    assert.equal(state().open, true);
  });

  test('the second dismiss closes it without a cue', async () => {
    await press('dismiss');
    assert.deepEqual(state(), { open: false, failed: true, savedSinceOpen: false, cue: 'off' });
  });
});
