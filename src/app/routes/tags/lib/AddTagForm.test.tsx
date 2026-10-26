import assert from 'node:assert/strict';
import { createMemoryRouter, data, RouterProvider } from 'react-router';
import { describe, test } from 'vitest';
import { fireEvent, render, screen } from '~testing/dom';
import type { ActionResult } from './actionResult';
import { AddTagForm } from './AddTagForm';

const taken: ActionResult = { intent: 'add', code: 'taken', taken: 'Soep', error: 'De tag “Soep” bestaat al.' };

/** The form against an action that answers `answer`, and the bodies it was sent. */
const show = (answer: ActionResult) => {
  const sent: URLSearchParams[] = [];
  const done: string[] = [];
  const onDone = (message: string) => done.push(message);
  render(
    <RouterProvider
      router={createMemoryRouter([
        {
          path: '/',
          action: async ({ request }) => {
            sent.push(new URLSearchParams(await request.text()));
            return 'error' in answer ? data(answer, { status: 400 }) : data(answer);
          },
          element: <AddTagForm onDone={onDone} />,
        },
      ])}
    />,
  );
  return { sent, done };
};
const field = () => screen.getByTestId<HTMLInputElement>('AddTagForm-name');
const add = (text: string) => {
  fireEvent.change(field(), { target: { value: text } });
  fireEvent.click(screen.getByTestId('AddTagForm-submit'));
};

describe('tag-management › A taken name is refused', () => {
  test('the message is at the field and the typed name stays', async () => {
    show(taken);
    add('soep');
    assert.equal((await screen.findByTestId('AddTagForm-error')).textContent, taken.error);
    assert.equal(field().value, 'soep');
    assert.equal(field().getAttribute('aria-invalid'), 'true');
  });

  test('the message goes away when the name changes', async () => {
    show(taken);
    add('soep');
    await screen.findByTestId('AddTagForm-error');
    fireEvent.change(field(), { target: { value: 'soepen' } });
    assert.equal(screen.queryByTestId('AddTagForm-error'), null);
  });
});

describe('tag-management › A tag is added', () => {
  test('the name is posted with the intent "add"', async () => {
    const { sent, done } = show({ done: 'Tag “Kerst” toegevoegd.' });
    add('Kerst');
    await screen.findByTestId('AddTagForm-name');
    await new Promise((r) => setTimeout(r, 20));
    assert.deepEqual(Object.fromEntries(sent[0]!), { intent: 'add', name: 'Kerst' });
    assert.deepEqual(done, ['Tag “Kerst” toegevoegd.']);
  });

  test('the field is emptied', async () => {
    show({ done: 'ok' });
    add('Kerst');
    await new Promise((r) => setTimeout(r, 20));
    assert.equal(field().value, '');
  });
});
