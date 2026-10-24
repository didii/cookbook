import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, test, vi } from 'vitest';
import { cssFor, hidesAt } from '~testing/css';
import { act, fireEvent, render, screen } from '~testing/dom';
import { NoteSheet } from './NoteSheet';
import { useNote } from './useNote';

const realFetch = globalThis.fetch;
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  globalThis.fetch = (() => Promise.resolve(new Response(null, { status: 204 }))) as typeof fetch;
});
afterEach(() => {
  vi.useRealTimers();
  globalThis.fetch = realFetch;
});

function Sheet({ saved }: { saved: string }) {
  return (
    <div>
      <p data-testid="outside">elders</p>
      <NoteSheetWithState saved={saved} />
    </div>
  );
}
function NoteSheetWithState({ saved }: { saved: string }) {
  return <NoteSheet note={useNote('soep', saved, true)} />;
}
const button = () => screen.getByTestId('NoteSheet-button');
const field = () => screen.getByTestId<HTMLTextAreaElement>('NoteSheet-field');
const sheet = () => screen.queryByTestId('NoteSheet-sheet');
const open = async (saved = 'oud') => {
  render(<Sheet saved={saved} />);
  await act(async () => void fireEvent.click(button()));
};
const type = (value: string) => act(async () => void fireEvent.change(field(), { target: { value } }));

describe('recipe-note › Recipe without a note', () => {
  beforeEach(() => {
    render(<Sheet saved="" />);
  });

  test('the button has no marker', () => {
    assert.equal(screen.queryByTestId('NoteSheet-marker'), null);
  });

  test('the button offers to open the note', () => {
    assert.equal(button().getAttribute('aria-label'), 'Open mijn notitie');
  });

  test('the button is only there below 52rem', async () => {
    assert.ok(await hidesAt(screen.getByTestId('NoteSheet-root').className, '(width >= 52rem)'));
  });
});

describe('recipe-note › Recipe with a note', () => {
  test('the button has a marker', () => {
    render(<Sheet saved="Minder zout" />);
    assert.ok(screen.getByTestId('NoteSheet-marker'));
  });

  test('opening shows the note', async () => {
    render(<Sheet saved="Minder zout" />);
    await act(async () => void fireEvent.click(button()));
    assert.equal(field().value, 'Minder zout');
  });
});

describe('recipe-note › Opening the note field', () => {
  beforeEach(async () => {
    await open();
  });

  test('the field shows the note', () => {
    assert.equal(field().value, 'oud');
  });

  test('the sheet is a dialog named "Mijn notitie"', () => {
    assert.equal(sheet()!.tagName, 'DIALOG');
    assert.equal(sheet()!.getAttribute('aria-label'), 'Mijn notitie');
  });

  test('the button turns into a red close button', async () => {
    assert.equal(button().getAttribute('aria-label'), 'Sluit mijn notitie');
    assert.equal(button().getAttribute('aria-expanded'), 'true');
    assert.match(await cssFor(button().className), /background-color: var\(--color-red\)/);
  });

  test('the sheet says the note is only for you', () => {
    assert.ok(screen.getByText('Alleen voor jou'));
  });

  test('the field has focus', () => {
    assert.equal(document.activeElement, field());
  });
});

describe('recipe-note › Closing by tapping outside', () => {
  beforeEach(async () => {
    await open();
  });

  test('a tap inside the field leaves it open', async () => {
    await act(async () => void fireEvent.click(field()));
    assert.ok(sheet());
  });

  test('a tap on the scrim closes the sheet', async () => {
    await act(async () => void fireEvent.click(screen.getByTestId('NoteSheet-scrim')));
    assert.equal(sheet(), null);
  });

  test('focus returns to the button', async () => {
    await act(async () => void fireEvent.click(screen.getByTestId('NoteSheet-scrim')));
    assert.equal(document.activeElement, button());
  });
});

describe('recipe-note › Closing with the button', () => {
  beforeEach(async () => {
    await open();
    await act(async () => void fireEvent.click(button()));
  });

  test('the sheet is closed', () => {
    assert.equal(sheet(), null);
  });

  test('focus returns to the button', () => {
    assert.equal(document.activeElement, button());
  });
});

describe('NoteSheet', () => {
  test('Escape closes the field', async () => {
    await open();
    await act(async () => void fireEvent.keyDown(document, { key: 'Escape' }));
    assert.equal(sheet(), null);
  });

  describe('the cue after a change', () => {
    beforeEach(async () => {
      await open();
      await type('nieuw');
      await act(async () => void fireEvent.click(button()));
    });

    test('shows the cue next to the closed button', () => {
      assert.ok(screen.getByTestId('NoteCue-cue'));
    });
  });
});

describe('recipe-note › Hint while there is unsaved text', () => {
  beforeEach(async () => {
    await open();
    await type('nieuw');
  });

  test('the hint explains the autosave', () => {
    assert.ok(screen.getByTestId('NoteSheet-hint').textContent);
  });

  test('no saved message shows', () => {
    assert.equal(screen.queryByTestId('NoteSheet-saved'), null);
  });
});

describe('recipe-note › Saved replaces the hint', () => {
  beforeEach(async () => {
    await open();
    await type('nieuw');
    await act(async () => vi.advanceTimersByTimeAsync(5000));
  });

  test('the hint is gone', () => {
    assert.equal(screen.queryByTestId('NoteSheet-hint'), null);
  });

  test('"Bewaard" shows', () => {
    assert.equal(screen.getByTestId('NoteSheet-saved').textContent?.trim(), 'Bewaard');
  });

  test('the saved message is inside the status', () => {
    assert.ok(screen.getByTestId('NoteSheet-status').contains(screen.getByTestId('NoteSheet-saved')));
  });
});

describe('recipe-note › Typing brings the hint back', () => {
  beforeEach(async () => {
    await open();
    await type('nieuw');
    await act(async () => vi.advanceTimersByTimeAsync(5000));
    await type('nieuwer');
  });

  test('the hint shows again', () => {
    assert.ok(screen.getByTestId('NoteSheet-hint'));
  });

  test('the saved message is gone', () => {
    assert.equal(screen.queryByTestId('NoteSheet-saved'), null);
  });
});

describe('recipe-note › Opening alone shows the hint', () => {
  beforeEach(async () => {
    await open();
  });

  test('the hint shows', () => {
    assert.ok(screen.getByTestId('NoteSheet-hint'));
  });

  test('no saved message shows', () => {
    assert.equal(screen.queryByTestId('NoteSheet-saved'), null);
  });
});
