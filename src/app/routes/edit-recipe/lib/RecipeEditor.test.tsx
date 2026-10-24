import assert from 'node:assert/strict';
import type { ComponentProps } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, test } from 'vitest';
import { defaultRules } from '~app/shared/rules';
import { render, screen } from '~testing/dom';
import { emptyDraftSeed } from './draft';
import { RecipeEditor } from './RecipeEditor';

// Needs a browser: the layout at a wide width.
test.todo('recipe-form › Wide screen layout');
// Needs a browser: the layout at a phone width.
test.todo('recipe-form › Narrow screen layout');
// Needs a browser: a fixed bar while scrolling.
test.todo('recipe-form › Save bar stays in view');
// Needs a browser and a pending response.
test.todo('recipe-form › Save is busy while storing');
// Needs a browser: clicking the link and checking the navigation.
test.todo('recipe-form › Cancel leaves without storing');
// Needs a browser: the inline question and its focus.
test.todo('recipe-form › Reset asks first');
// Needs a browser: answering "Nee" and pressing Esc.
test.todo('recipe-form › Reset can be declined');

// An edited field is kept as a draft on the device; start every test without one.
beforeEach(() => window.localStorage.clear());

const editorProps: ComponentProps<typeof RecipeEditor> = {
  rules: defaultRules,
  heading: 'Nieuw recept',
  authors: ['Oma', 'Mama'],
  initial: emptyDraftSeed,
  values: emptyDraftSeed,
  errors: {},
  tile: 0,
  cancelTo: '/',
};
const show = (props: Partial<ComponentProps<typeof RecipeEditor>> = {}) =>
  render(<RouterProvider router={createMemoryRouter([{ path: '/', element: <RecipeEditor {...editorProps} {...props} /> }])} />);

describe('recipe-creation › Required fields are marked', () => {
  const label = (id: string) => document.querySelector(`label[for=${id}]`)!.textContent;

  // The title and author labels carry an asterisk and the form explains it; the servings label has none.
  test('the title label carries an asterisk', () => {
    show();
    assert.match(label('title') ?? '', /\*$/);
  });

  test('the author label carries an asterisk', () => {
    show();
    assert.match(label('author') ?? '', /\*$/);
  });

  test('the servings label has none', () => {
    show();
    assert.doesNotMatch(label('servings') ?? '', /\*/);
  });

  test('the form explains the asterisk', () => {
    show();
    assert.ok(screen.getByTestId('RecipeEditor-required').textContent?.includes('*'));
  });
});

describe('recipe-creation › Errors are announced and focused', () => {
  const errors = { title: 'Vul een titel in.', author: 'Vul een kok in.' };

  // Each error is text tied to its field, and focus is on the first field in error.
  for (const [id, message] of Object.entries(errors)) {
    test(`the ${id} field is marked invalid`, () => {
      show({ errors });
      assert.equal(document.getElementById(id)!.getAttribute('aria-invalid'), 'true');
    });

    test(`the ${id} field is described by its error`, () => {
      show({ errors });
      const field = document.getElementById(id)!;
      assert.equal(document.getElementById(field.getAttribute('aria-describedby')!)?.textContent, message);
    });
  }

  test('focus is on the first field in error', () => {
    show({ errors });
    assert.ok(document.activeElement === document.getElementById('title'));
  });

  // With only a later field in error, focus goes there.
  test('focus goes to a later field when only that one is in error', () => {
    show({ errors: { servings: 'Vul een getal in.' } });
    assert.ok(document.activeElement === document.getElementById('servings'));
  });
});

// Both routes render this editor and write no fields of their own, so the form can only differ in values, heading and cancel target.
describe('recipe-editing › Same form for new and existing recipes', () => {
  const controls = (container: HTMLElement) => [...container.querySelectorAll('form [name]')].map((el) => el.getAttribute('name')).sort();
  const stored = { ...emptyDraftSeed, title: 'Soep', author: 'Oma', servings: '4', time: '1u', intro: 'Warm' };

  test('a new and an existing recipe have the same fields', () => {
    const fresh = controls(show().container);
    const existing = controls(
      show({ heading: 'Recept bewerken', initial: stored, values: stored, slug: 'soep', updatedAt: '2026-01-01T00:00:00Z' }).container,
    );
    assert.deepEqual(existing, fresh);
  });

  test('the heading is an h1', () => {
    show();
    assert.equal(screen.getByTestId('RecipeEditor-heading').tagName, 'H1');
  });

  test('the title field has a title label', () => {
    show();
    assert.match(screen.getByTestId<HTMLInputElement>('RecipeEditor-title').labels?.[0]?.textContent ?? '', /Titel/);
  });
});
