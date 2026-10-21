import assert from 'node:assert/strict';
import { afterEach, beforeEach, mock, test } from 'node:test';
import { act, fireEvent, render, screen } from '~testing/dom';
import { NoteSheet } from './NoteSheet';
import { useNote } from './useNote';

const realFetch = globalThis.fetch;
beforeEach(() => {
  mock.timers.enable({ apis: ['setTimeout'] });
  globalThis.fetch = (() => Promise.resolve(new Response(null, { status: 204 }))) as typeof fetch;
});
afterEach(() => {
  mock.timers.reset();
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

test('recipe-note › Recipe without a note', () => {
  render(<Sheet saved="" />);
  assert.equal(screen.queryByTestId('NoteSheet-marker'), null);
  assert.equal(button().getAttribute('aria-label'), 'Open mijn notitie');
  assert.ok(button().closest('div')!.classList.contains('min-[52rem]:hidden'));
});

test('recipe-note › Recipe with a note', async () => {
  render(<Sheet saved="Minder zout" />);
  assert.ok(screen.getByTestId('NoteSheet-marker'));
  await act(async () => void fireEvent.click(button()));
  assert.equal(field().value, 'Minder zout');
});

test('recipe-note › Opening the note field', async () => {
  await open();
  assert.equal(field().value, 'oud');
  assert.equal(sheet()!.getAttribute('role'), 'dialog');
  assert.equal(sheet()!.getAttribute('aria-label'), 'Mijn notitie');
  assert.equal(button().getAttribute('aria-label'), 'Sluit mijn notitie');
  assert.equal(button().getAttribute('aria-expanded'), 'true');
  assert.ok(button().classList.contains('bg-red'));
  assert.ok(screen.getByText('Alleen voor jou'));
  assert.equal(document.activeElement, field());
});

test('recipe-note › Closing by tapping outside', async () => {
  await open();
  // A tap inside the field leaves it open.
  await act(async () => void fireEvent.pointerDown(field()));
  assert.ok(sheet());
  await act(async () => void fireEvent.pointerDown(screen.getByTestId('outside')));
  assert.equal(sheet(), null);
  assert.equal(document.activeElement, button());
});

test('recipe-note › Closing with the button', async () => {
  await open();
  // The button's own pointerdown is not "outside"; its click closes.
  await act(async () => void fireEvent.pointerDown(button()));
  assert.ok(sheet());
  await act(async () => void fireEvent.click(button()));
  assert.equal(sheet(), null);
  assert.equal(document.activeElement, button());
});

test('Escape closes the field', async () => {
  await open();
  await act(async () => void fireEvent.keyDown(document, { key: 'Escape' }));
  assert.equal(sheet(), null);
});

test('recipe-note › Hint while there is unsaved text', async () => {
  await open();
  await type('nieuw');
  assert.equal(screen.getByTestId('NoteSheet-hint').textContent, 'Wordt vanzelf bewaard. Tik buiten het veld om te sluiten.');
  assert.equal(screen.queryByTestId('NoteSheet-saved'), null);
});

test('recipe-note › Saved replaces the hint', async () => {
  await open();
  await type('nieuw');
  await act(async () => mock.timers.tick(5000));
  assert.equal(screen.queryByTestId('NoteSheet-hint'), null);
  assert.equal(screen.getByTestId('NoteSheet-saved').textContent?.trim(), 'Bewaard');
  assert.equal(screen.getByTestId('NoteSheet-status').getAttribute('role'), 'status');
});

test('recipe-note › Typing brings the hint back', async () => {
  await open();
  await type('nieuw');
  await act(async () => mock.timers.tick(5000));
  await type('nieuwer');
  assert.ok(screen.getByTestId('NoteSheet-hint'));
  assert.equal(screen.queryByTestId('NoteSheet-saved'), null);
});

test('recipe-note › Opening alone shows the hint', async () => {
  await open();
  assert.ok(screen.getByTestId('NoteSheet-hint'));
  assert.equal(screen.queryByTestId('NoteSheet-saved'), null);
});

test('the cue sits next to the closed button after a change and a tap removes it', async () => {
  await open();
  await type('nieuw');
  await act(async () => void fireEvent.click(button()));
  const cue = screen.getByTestId('NoteCue-cue');
  assert.equal(cue.textContent?.trim(), 'Notitie bewaard');
  assert.equal(screen.getByTestId('NoteCue-status').getAttribute('role'), 'status');
  await act(async () => void fireEvent.click(cue));
  assert.equal(screen.queryByTestId('NoteCue-cue'), null);
});
