import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, test } from 'vitest';
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

describe('recipe-note › Note panel on a wide screen', () => {
  beforeEach(() => {
    render(<Panel />);
  });

  test('the field shows the note', () => {
    assert.equal(field().value, 'oud');
  });

  test('the panel says the note is only for you', () => {
    assert.ok(screen.getByText('Alleen voor jou'));
  });

  test('there is no button to open it', () => {
    assert.equal(screen.queryByRole('button', { name: /notitie/i }), null);
  });

  test('it is shown from 52rem only', () => {
    assert.ok(screen.getByTestId('NotePanel-panel').classList.contains('max-[51.99rem]:hidden'));
  });
});

describe('recipe-note › Leaving the field saves', () => {
  beforeEach(async () => {
    render(<Panel />);
    await type('nieuw');
    await leave();
  });

  test('the note is stored', () => {
    assert.deepEqual(sent, ['note=nieuw']);
  });

  test('the cue says the note is saved', () => {
    assert.equal(screen.getByTestId('NoteCue-cue').textContent?.trim(), 'Notitie bewaard');
  });
});

describe('NotePanel', () => {
  describe('leaving the field without a change', () => {
    beforeEach(async () => {
      render(<Panel />);
      await leave();
    });

    test('stores nothing', () => {
      assert.deepEqual(sent, []);
    });

    test('shows no cue', () => {
      assert.equal(screen.queryByTestId('NoteCue-cue'), null);
    });
  });
});

describe('recipe-note › Wide save failure shows a message', () => {
  beforeEach(async () => {
    status = 500;
    render(<Panel />);
    await type('nieuw');
    await leave();
  });

  test('the message says the note was not saved', () => {
    assert.ok(screen.getByTestId('NotePanel-failed').textContent?.includes('niet bewaard'));
  });

  test('the typed text stays in the field', () => {
    assert.equal(field().value, 'nieuw');
  });

  test('no cue is shown', () => {
    assert.equal(screen.queryByTestId('NoteCue-cue'), null);
  });
});
