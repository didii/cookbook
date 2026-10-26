import assert from 'node:assert/strict';
import { createMemoryRouter, data, RouterProvider } from 'react-router';
import { afterEach, describe, test } from 'vitest';
import type { ManagedTag } from '~app/shared/tags';
import { act, fireEvent, openAutocomplete, render, screen, setViewport, within } from '~testing/dom';
import type { ActionResult } from './actionResult';
import { TagForm } from './TagForm';

const soepen: ManagedTag = { name: 'Soepen', category: 'Seizoen', uses: 3 };

/** The form against an action that answers with `answer`, and the fields it was sent. */
const show = (answer: ActionResult = { done: 'Opgeslagen.' }, tag: ManagedTag = soepen) => {
  const sent: Record<string, string>[] = [];
  const done: string[] = [];
  const closed = { count: 0 };
  render(
    <RouterProvider
      router={createMemoryRouter([
        {
          path: '/',
          action: async ({ request }) => {
            sent.push(Object.fromEntries(new URLSearchParams(await request.text())));
            return 'error' in answer ? data(answer, { status: 400 }) : data(answer);
          },
          element: (
            <TagForm
              tag={tag}
              names={['Soep', 'Soepen', 'Winter']}
              categories={['Gerecht', 'Seizoen']}
              onClose={() => closed.count++}
              onDone={(message) => done.push(message)}
            />
          ),
        },
      ])}
    />,
  );
  return { sent, done, closed };
};
const nameField = () => screen.getByTestId<HTMLInputElement>('TagForm-name');
// The category comes before the merge picker, so it is the first suggest field.
const categoryField = () => within(screen.getByTestId('TagForm-form')).getAllByTestId<HTMLInputElement>('SuggestInput-field')[0]!;
const type = (field: HTMLElement, value: string) => fireEvent.change(field, { target: { value } });
const click = (id: string) => fireEvent.click(screen.getByTestId(id));
const actions = () => within(screen.getByTestId('TagForm-actions'));
const taken: ActionResult = { intent: 'save', code: 'taken', taken: 'Soep', error: 'De tag “Soep” bestaat al.' };

afterEach(() => setViewport(1024));

describe('tag-management › Row opens the form', () => {
  test('the name is filled in', () => {
    show();
    assert.equal(nameField().value, 'Soepen');
  });

  test('the category is filled in', () => {
    show();
    assert.equal(categoryField().value, 'Seizoen');
  });

  test('a tag without a category has an empty category field', () => {
    show(undefined, { ...soepen, category: null });
    assert.equal(categoryField().value, '');
  });

  test('the focus moves to the name', () => {
    show();
    assert.equal(document.activeElement, nameField());
  });
});

describe('tag-management › Actions of the form', () => {
  test('they are "Opslaan", "Samenvoegen met…" and "Verwijderen"', () => {
    show();
    assert.deepEqual(
      within(screen.getByTestId('TagForm-actions'))
        .getAllByRole('button')
        .map((b) => b.getAttribute('data-testid')),
      ['TagActions-save', 'TagActions-merge', 'TagActions-delete'],
    );
  });
});

describe('tag-management › Name and category in one save', () => {
  test('both are sent in one request with the current name', async () => {
    const { sent } = show();
    type(nameField(), 'Bouillon');
    type(categoryField(), 'Gerecht');
    click('TagActions-save');
    await screen.findByTestId('TagForm-form');
    await new Promise((r) => setTimeout(r, 20));
    assert.deepEqual(sent, [{ intent: 'save', current: 'Soepen', name: 'Bouillon', category: 'Gerecht' }]);
  });

  test('Enter in a field submits the form, which saves', async () => {
    const { sent } = show();
    fireEvent.submit(screen.getByTestId('TagForm-form'));
    await new Promise((r) => setTimeout(r, 20));
    assert.equal(sent.length, 1);
  });

  test('the confirmation of the answer is reported', async () => {
    const { done } = show({ done: 'Opgeslagen.' });
    click('TagActions-save');
    await new Promise((r) => setTimeout(r, 20));
    assert.deepEqual(done, ['Opgeslagen.']);
  });
});

describe('tag-management › A taken name refuses the whole save', () => {
  test('a message at the name says the tag exists', async () => {
    show(taken);
    type(nameField(), 'soep');
    click('TagActions-save');
    assert.equal((await screen.findByTestId('TagForm-error')).textContent, taken.error);
    assert.equal(nameField().getAttribute('aria-invalid'), 'true');
  });

  test('the typed name and category stay', async () => {
    show(taken);
    type(nameField(), 'soep');
    type(categoryField(), 'Gerecht');
    click('TagActions-save');
    await screen.findByTestId('TagForm-error');
    assert.deepEqual([nameField().value, categoryField().value], ['soep', 'Gerecht']);
  });

  test('a button offers to merge with the taken tag', async () => {
    show(taken);
    click('TagActions-save');
    assert.ok(await screen.findByTestId('TagForm-offerMerge'));
  });

  test('the message goes away when the name changes', async () => {
    show(taken);
    click('TagActions-save');
    await screen.findByTestId('TagForm-error');
    type(nameField(), 'Soepje');
    assert.equal(screen.queryByTestId('TagForm-error'), null);
  });
});

describe('TagForm category error', () => {
  test('its message is at the category and not at the name', async () => {
    show({ intent: 'save', code: 'tooLong', field: 'category', error: 'Dit is te lang: maximaal 100 tekens.' });
    click('TagActions-save');
    assert.equal((await screen.findByTestId('TagForm-categoryError')).textContent, 'Dit is te lang: maximaal 100 tekens.');
    assert.equal(screen.queryByTestId('TagForm-error'), null);
    assert.equal(nameField().getAttribute('aria-invalid'), null);
  });
});

describe('tag-management › Escape closes the form', () => {
  test('Escape in a field closes the form', () => {
    const { closed } = show();
    fireEvent.keyDown(nameField(), { key: 'Escape' });
    assert.equal(closed.count, 1);
  });

  test('Escape in an open suggestion list leaves the form open', () => {
    const { closed } = show();
    const field = categoryField();
    field.setAttribute('aria-expanded', 'true');
    fireEvent.keyDown(field, { key: 'Escape' });
    assert.equal(closed.count, 0);
  });
});

describe('tag-management › Merge offered for a taken name', () => {
  const offer = async () => {
    show(taken);
    type(nameField(), 'soep');
    type(categoryField(), 'Gerecht');
    click('TagActions-save');
    fireEvent.click(await screen.findByTestId('TagForm-offerMerge'));
  };

  test('the actions part shows the merge with "Soep" chosen', async () => {
    await offer();
    assert.equal(actions().getByTestId<HTMLInputElement>('SuggestInput-field').value, 'Soep');
    assert.equal(actions().getByTestId<HTMLButtonElement>('MergeActions-confirm').disabled, false);
  });

  test('the typed name and category stay in the fields', async () => {
    await offer();
    assert.deepEqual([nameField().value, categoryField().value], ['soep', 'Gerecht']);
  });
});

describe('tag-management › Empty or too long name', () => {
  test.each([
    ['empty', 'Geef de tag een naam.'],
    ['tooLong', 'Dit is te lang: maximaal 100 tekens.'],
  ] as const)('a refusal "%s" shows its message at the name', async (code, error) => {
    show({ intent: 'save', code, error });
    click('TagActions-save');
    assert.equal((await screen.findByTestId('TagForm-error')).textContent, error);
    assert.equal(screen.queryByTestId('TagForm-offerMerge'), null);
  });
});

describe('tag-management › Merge replaces only the actions', () => {
  test('the picker and preview replace the three actions', () => {
    show();
    click('TagActions-merge');
    assert.ok(actions().getByTestId('MergeActions-preview'));
    assert.equal(actions().queryByTestId('TagActions-save'), null);
  });

  test('the name field still has the typed name', () => {
    show();
    type(nameField(), 'Bouillon');
    click('TagActions-merge');
    assert.equal(nameField().value, 'Bouillon');
  });

  test('the category field still has the typed category', () => {
    show();
    type(categoryField(), 'Gerecht');
    click('TagActions-merge');
    assert.equal(categoryField().value, 'Gerecht');
  });
});

describe('tag-management › Merge is cancelled', () => {
  test('the three actions are back and nothing is sent', async () => {
    const { sent } = show();
    click('TagActions-merge');
    click('MergeActions-cancel');
    assert.ok(actions().getByTestId('TagActions-save'));
    await new Promise((r) => setTimeout(r, 20));
    assert.deepEqual(sent, []);
  });
});

describe('tag-management › Delete is cancelled', () => {
  test('the three actions are back and nothing is sent', async () => {
    const { sent } = show();
    click('TagActions-delete');
    click('DeleteActions-cancel');
    assert.ok(actions().getByTestId('TagActions-save'));
    await new Promise((r) => setTimeout(r, 20));
    assert.deepEqual(sent, []);
  });
});

describe('tag-management › Own tag is not offered', () => {
  test('the name of this tag is not suggested', async () => {
    show();
    click('TagActions-merge');
    const picker = actions().getByTestId('SuggestInput-field');
    openAutocomplete(picker);
    fireEvent.change(picker, { target: { value: 'soep' } });
    await screen.findAllByTestId('SuggestInput-option');
    assert.deepEqual(
      screen.getAllByTestId('SuggestInput-option').map((o) => o.textContent),
      ['Soep'],
    );
    await act(async () => {});
  });

  test('typing the name of this tag leaves "Samenvoegen" disabled', () => {
    show();
    click('TagActions-merge');
    type(actions().getByTestId('SuggestInput-field'), 'soepen');
    assert.equal(actions().getByTestId<HTMLButtonElement>('MergeActions-confirm').disabled, true);
  });
});

describe('TagForm', () => {
  test('a second submit while a request runs sends nothing', async () => {
    const { sent } = show();
    const form = screen.getByTestId('TagForm-form');
    fireEvent.submit(form);
    fireEvent.submit(form);
    await new Promise((r) => setTimeout(r, 20));
    assert.equal(sent.length, 1);
  });

  test('Enter in the merge part without a chosen tag sends nothing', async () => {
    const { sent } = show();
    click('TagActions-merge');
    fireEvent.submit(screen.getByTestId('TagForm-form'));
    await new Promise((r) => setTimeout(r, 20));
    assert.deepEqual(sent, []);
  });

  test('merging posts the tag and the chosen stored tag', async () => {
    const { sent, done } = show({ done: 'Samengevoegd met “Soep”.' });
    click('TagActions-merge');
    type(actions().getByTestId('SuggestInput-field'), 'soep');
    click('MergeActions-confirm');
    await new Promise((r) => setTimeout(r, 20));
    assert.deepEqual(sent, [{ intent: 'merge', from: 'Soepen', into: 'Soep' }]);
    assert.deepEqual(done, ['Samengevoegd met “Soep”.']);
  });

  test('deleting posts the tag name', async () => {
    const { sent, done } = show({ done: 'Tag “Soepen” verwijderd.' });
    click('TagActions-delete');
    click('DeleteActions-confirm');
    await new Promise((r) => setTimeout(r, 20));
    assert.deepEqual(sent, [{ intent: 'delete', name: 'Soepen' }]);
    assert.equal(done.length, 1);
  });

  test('a refused merge shows its message below the actions', async () => {
    show({ intent: 'merge', code: 'notFound', error: 'Deze tag bestaat niet meer.' });
    click('TagActions-merge');
    type(actions().getByTestId('SuggestInput-field'), 'Soep');
    click('MergeActions-confirm');
    assert.equal((await screen.findByTestId('TagForm-actionError')).textContent, 'Deze tag bestaat niet meer.');
    assert.equal(screen.queryByTestId('TagForm-error'), null);
  });

  test('tapping the backdrop reports the close', () => {
    const { closed } = show();
    click('TagForm-backdrop');
    assert.equal(closed.count, 1);
  });

  test('the page behind a sheet cannot scroll on a phone', () => {
    setViewport(390);
    show();
    assert.equal(document.body.style.overflow, 'hidden');
  });

  test('the page scrolls as usual on a wide screen', () => {
    show();
    assert.equal(document.body.style.overflow, '');
  });
});

// Needs a real viewport: whether the form is a sheet or a panel is layout (media query), which happy-dom does not compute.
test.todo('tag-management › Sheet on a phone, panel on a wide screen');

// Needs a real pointer and viewport: the backdrop only exists below 48rem and covers the page.
test.todo('tag-management › Outside click closes the sheet');
