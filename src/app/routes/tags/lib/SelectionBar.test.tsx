import assert from 'node:assert/strict';
import { createMemoryRouter, data, RouterProvider } from 'react-router';
import { describe, test } from 'vitest';
import { fireEvent, render, screen, waitFor } from '~testing/dom';
import type { ActionResult } from './actionResult';
import { SelectionBar } from './SelectionBar';

const show = (selected: string[], answer: ActionResult = { done: '2 tags aangepast.' }) => {
  const sent: URLSearchParams[] = [];
  const calls = { all: 0, none: 0, done: [] as string[] };
  const onDone = (message: string) => calls.done.push(message);
  render(
    <RouterProvider
      router={createMemoryRouter([
        {
          path: '/',
          action: async ({ request }) => {
            sent.push(new URLSearchParams(await request.text()));
            return 'error' in answer ? data(answer, { status: 400 }) : data(answer);
          },
          element: (
            <SelectionBar
              selected={selected}
              categories={['Gerecht', 'Seizoen']}
              onSelectAll={() => calls.all++}
              onSelectNone={() => calls.none++}
              onDone={onDone}
            />
          ),
        },
      ])}
    />,
  );
  return { sent, calls };
};
const apply = () => screen.getByTestId<HTMLButtonElement>('SelectionBar-apply');
const field = () => screen.getByTestId<HTMLInputElement>('SuggestInput-field');

describe('tag-management › Select mode shows checkboxes', () => {
  test('the bar says 0 selected', () => {
    show([]);
    assert.equal(screen.getByTestId('SelectionBar-count').textContent, '0 geselecteerd');
  });
});

describe('tag-management › Setting needs a selection', () => {
  test('"Instellen" is disabled while nothing is selected', () => {
    show([]);
    assert.equal(apply().disabled, true);
  });

  test('it is enabled with a selection', () => {
    show(['Soep']);
    assert.equal(apply().disabled, false);
  });
});

describe('tag-management › Setting a category on the selection', () => {
  test('every selected tag and the category are sent in one request', async () => {
    const { sent } = show(['Soep', 'Bakken']);
    fireEvent.change(field(), { target: { value: 'Gerecht' } });
    fireEvent.click(apply());
    await waitFor(() => assert.ok(sent.length === 1));
    assert.equal(sent[0]!.get('intent'), 'bulk');
    assert.equal(sent[0]!.get('category'), 'Gerecht');
    assert.deepEqual(sent[0]!.getAll('name'), ['Soep', 'Bakken']);
  });

  test('the confirmation of the answer is reported and the field is emptied', async () => {
    const { calls } = show(['Soep', 'Bakken']);
    fireEvent.change(field(), { target: { value: 'Gerecht' } });
    fireEvent.click(apply());
    await waitFor(() => assert.ok(calls.done.length === 1));
    assert.deepEqual(calls.done, ['2 tags aangepast.']);
    assert.equal(field().value, '');
  });
});

describe('tag-management › Empty category on the selection', () => {
  test('an empty category is sent as it is', async () => {
    const { sent } = show(['Soep']);
    fireEvent.click(apply());
    await waitFor(() => assert.ok(sent.length === 1));
    assert.equal(sent[0]!.get('category'), '');
  });
});

describe('SelectionBar', () => {
  test('the count follows the selection', () => {
    show(['Soep', 'Bakken']);
    assert.equal(screen.getByTestId('SelectionBar-count').textContent, '2 geselecteerd');
  });

  test('"Alles selecteren" and "Niets" report', () => {
    const { calls } = show(['Soep']);
    fireEvent.click(screen.getByTestId('SelectionBar-all'));
    fireEvent.click(screen.getByTestId('SelectionBar-none'));
    assert.deepEqual([calls.all, calls.none], [1, 1]);
  });

  test('a refusal shows its message', async () => {
    show(['Soep'], { intent: 'bulk', code: 'tooLong', error: 'Dit is te lang: maximaal 100 tekens.' });
    fireEvent.click(apply());
    assert.equal((await screen.findByTestId('SelectionBar-error')).textContent, 'Dit is te lang: maximaal 100 tekens.');
  });
});
