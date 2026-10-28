import assert from 'node:assert/strict';
import type { ComponentProps } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, test, vi } from 'vitest';
import { defaultRules } from '~app/shared/rules';
import { act, cleanup, fireEvent, openAutocomplete, precedes, render, screen } from '~testing/dom';
import { emptyDraftSeed } from './draft';
import { RecipeEditor } from './RecipeEditor';
import { limits } from './recipeValidation';

// Shrinking needs a canvas and uploading needs the Worker; the photo field's own tests cover them. Here the upload stays pending, so the field shows the preview.
vi.mock('./photo/photoFile', () => ({ resizePhoto: async (blob: Blob) => blob, uploadPhoto: () => new Promise(() => undefined) }));

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

const editorProps: ComponentProps<typeof RecipeEditor> = {
  rules: defaultRules,
  heading: 'Nieuw recept',
  authors: ['Oma', 'Mama'],
  tags: ['Soep', 'Winter'],
  initial: emptyDraftSeed,
  values: emptyDraftSeed,
  errors: {},
  tile: 0,
  cancelTo: '/',
};
const show = (props: Partial<ComponentProps<typeof RecipeEditor>> = {}) =>
  render(<RouterProvider router={createMemoryRouter([{ path: '/', element: <RecipeEditor {...editorProps} {...props} /> }])} />);

describe('recipe-deletion › Delete button is shown', () => {
  test('the button comes after the form', () => {
    show({ slug: 'appeltaart' });
    assert.ok(precedes(screen.getByTestId('RecipeEditor-form'), screen.getByTestId('DeleteRecipe-open')));
  });

  test('the button is not inside the form', () => {
    show({ slug: 'appeltaart' });
    assert.ok(!screen.getByTestId('RecipeEditor-form').contains(screen.getByTestId('DeleteRecipe-open')));
  });
});

describe('RecipeEditor delete button', () => {
  test('it names the stored title, not the edited one', () => {
    const initial = { ...emptyDraftSeed, title: 'Appeltaart' };
    show({ slug: 'appeltaart', initial, values: { ...initial, title: 'Peretaart' } });
    assert.ok(screen.getByTestId('DeleteRecipe-title').textContent?.includes('Appeltaart'));
  });

  test('it posts to the delete route of the editor slug', () => {
    show({ slug: 'appeltaart' });
    assert.equal(screen.getByTestId('DeleteRecipe-form').getAttribute('action'), '/recepten/appeltaart/verwijderen');
  });
});

describe('recipe-deletion › No delete button for a new recipe', () => {
  test('the page has no delete button', () => {
    show();
    assert.equal(screen.queryByTestId('DeleteRecipe-open'), null);
  });
});

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

const withTags = (...tags: string[]) => ({ ...emptyDraftSeed, title: 'Soep', author: 'Oma', tags });
const pickedTags = () => screen.queryAllByTestId('TagInput-tag').map((t) => t.textContent);

describe('recipe-form › Tags field in the side column', () => {
  test('the field has a Tags label', () => {
    show();
    assert.equal(screen.getByTestId<HTMLInputElement>('TagInput-field').labels?.[0]?.textContent, 'Tags');
  });

  test('the field comes below the preparation time', () => {
    show();
    assert.ok(precedes(screen.getByTestId('RecipeEditor-time'), screen.getByTestId('TagInput-field')));
  });
});

describe('recipe-form › Stored tags are shown when editing', () => {
  test('both tags are shown, alphabetically', () => {
    const stored = withTags('Winter', 'Soep');
    show({ initial: stored, values: stored, slug: 'soep', updatedAt: '2026-01-01T00:00:00Z' });
    assert.deepEqual(pickedTags(), ['Soep', 'Winter']);
  });
});

describe('recipe-form › Reset puts the tags back', () => {
  test('the starting tags are picked again', async () => {
    const stored = withTags('Soep', 'Winter');
    show({ initial: stored, values: stored, slug: 'soep', updatedAt: '2026-01-01T00:00:00Z' });
    fireEvent.click(screen.getAllByTestId('TagInput-remove')[0]);
    await act(async () => {});
    fireEvent.click(screen.getByTestId('SaveBar-reset'));
    fireEvent.click(screen.getByTestId('SaveBar-confirm'));
    assert.deepEqual(pickedTags(), ['Soep', 'Winter']);
  });
});

describe('the tags field in the editor', () => {
  test('the picked tags are posted as a JSON list', () => {
    const stored = withTags('Soep', 'Winter');
    show({ initial: stored, values: stored });
    assert.equal(screen.getByTestId<HTMLInputElement>('RecipeEditor-tags').value, '["Soep","Winter"]');
  });

  // The pill itself is TagInput's to test; the editor only has to hand the categories on.
  test('the categories of the tags reach the field', async () => {
    show({ tagCategories: { Soep: 'Gerecht' } });
    openAutocomplete(screen.getByTestId('TagInput-field'));
    await screen.findAllByTestId('TagInput-option');
    assert.deepEqual(
      screen.getAllByTestId('TagInput-category').map((c) => c.textContent),
      ['Gerecht'],
    );
    await act(async () => {});
  });

  test('an error is shown at the field', () => {
    show({ errors: { tags: 'Te lang.' } });
    assert.equal(document.getElementById(screen.getByTestId('TagInput-field').getAttribute('aria-describedby')!)?.textContent, 'Te lang.');
  });
});

describe('recipe-limits › Typing stops at the limit', () => {
  const fields: [string, () => HTMLElement, number][] = [
    ['title', () => screen.getByTestId('RecipeEditor-title'), limits.title],
    ['intro', () => screen.getByTestId('RecipeEditor-intro'), limits.intro],
    ['time', () => screen.getByTestId('RecipeEditor-time'), limits.time],
    ['source', () => screen.getByTestId('RecipeEditor-source'), limits.source],
    ['author', () => screen.getByTestId('AuthorInput-field'), limits.author],
    ['ingredient', () => screen.getByTestId('IngredientItem-field'), limits.ingredientLine],
    ['step', () => screen.getByTestId('StepText-field'), limits.step],
  ];
  for (const [name, find, max] of fields)
    test(`the ${name} field takes at most ${max} characters`, () => {
      show();
      assert.equal((find() as HTMLInputElement).maxLength, max);
    });
});

describe('RecipeEditor error wiring', () => {
  const stepValues = {
    ...emptyDraftSeed,
    steps: [
      { body: 'a', ingredients: [] },
      { body: 'b', ingredients: [] },
    ],
  };
  const withSteps = (errors: object) => show({ values: stepValues, initial: stepValues, errors });

  test('a step error reaches the step it is keyed to', () => {
    withSteps({ steps: { 1: 'Fout' } });
    assert.equal(screen.getAllByTestId('StepEditor-error').length, 1);
  });

  test('focus goes to the title before a step', () => {
    withSteps({ title: 'Fout', steps: { 1: 'Fout' } });
    assert.ok(document.activeElement === screen.getByTestId('RecipeEditor-title'));
  });

  test('focus goes to an ingredient row before a step', () => {
    withSteps({ ingredients: { 0: 'Fout' }, steps: { 1: 'Fout' } });
    assert.ok(document.activeElement === screen.getAllByTestId('IngredientItem-field')[0]);
  });

  test('focus goes to a step before the author', () => {
    withSteps({ author: 'Fout', steps: { 1: 'Fout' } });
    assert.ok(document.activeElement === screen.getAllByTestId('StepText-field')[1]);
  });

  for (const name of ['intro', 'time', 'source'] as const)
    test(`${name} gets its error`, () => {
      show({ errors: { [name]: 'Te lang.' } });
      assert.ok(screen.getByTestId(`RecipeEditor-${name}`).getAttribute('aria-describedby'));
    });
});

describe('recipe-source › Field in the side column', () => {
  test('the field follows the author field', () => {
    show();
    assert.ok(precedes(screen.getByTestId('AuthorInput-field'), screen.getByTestId('RecipeEditor-source')));
  });

  test('the field is not required', () => {
    show();
    assert.equal((screen.getByTestId('RecipeEditor-source') as HTMLInputElement).required, false);
  });

  test('the field has a hint', () => {
    show();
    assert.ok(screen.getByTestId('RecipeEditor-source').getAttribute('placeholder'));
  });
});

describe('recipe-source › Edit form shows the stored source', () => {
  test('the field contains it', () => {
    const stored = { ...emptyDraftSeed, title: 'Soep', author: 'Oma', source: 'Libelle' };
    show({ initial: stored, values: stored });
    assert.equal((screen.getByTestId('RecipeEditor-source') as HTMLInputElement).value, 'Libelle');
  });
});

describe('RecipeEditor import', () => {
  const recipePage = (extra: Record<string, unknown> = {}) =>
    `<html><head><script type="application/ld+json">${JSON.stringify({
      '@type': 'Recipe',
      name: 'Tomatensoep',
      description: 'Een klassieker.',
      recipeYield: '4 porties',
      totalTime: 'PT1H20M',
      recipeIngredient: ['500 g tomaten', '1 ui'],
      recipeInstructions: ['Snijd de ui.', 'Kook 20 minuten.'],
      image: 'https://example.com/soep.jpg',
      author: { name: 'Jamie' },
      ...extra,
    })}</script></head></html>`;
  const html = (body: string) => new Response(body, { headers: { 'Content-Type': 'text/html' } });
  const png = () => new Response(new Uint8Array([0x89, 0x50, 0x4e, 0x47]), { headers: { 'Content-Type': 'image/png' } });
  type Answers = { page?: () => Response; image?: () => Response };
  /** A Worker that answers both import endpoints. */
  const stubWorker = ({ page = () => html(recipePage()), image = png }: Answers = {}) => {
    const stub = vi.fn(async (url: string) => (url === '/importeren/foto' ? image() : page()));
    vi.stubGlobal('fetch', stub);
    return stub;
  };
  const importPage = async (address = 'https://example.com/soep') => {
    fireEvent.change(screen.getByTestId('ImportBox-address'), { target: { value: address } });
    await act(async () => void fireEvent.click(screen.getByTestId('ImportBox-button')));
  };
  const field = (id: string) => screen.getByTestId<HTMLInputElement>(id);
  const imageSrc = () => screen.queryByTestId('PhotoField-image')?.getAttribute('src');
  const askedFor = (stub: ReturnType<typeof stubWorker>) => stub.mock.calls.map(([url]) => url);

  afterEach(() => vi.unstubAllGlobals());

  describe('recipe-import › Form is prefilled', () => {
    test('the title, intro, servings and time are filled in', async () => {
      stubWorker();
      show({ canImport: true });
      await importPage();
      assert.equal(field('RecipeEditor-title').value, 'Tomatensoep');
      assert.equal(field('RecipeEditor-intro').value, 'Een klassieker.');
      assert.equal(field('RecipeEditor-servings').value, '4');
      assert.equal(field('RecipeEditor-time').value, '1u 20');
    });

    test('the ingredients are filled in', async () => {
      stubWorker();
      show({ canImport: true });
      await importPage();
      assert.deepEqual(
        screen.getAllByTestId<HTMLInputElement>('IngredientItem-field').map((i) => i.value),
        ['500 g tomaten', '1 ui', ''],
      );
    });

    test('the steps are filled in', async () => {
      stubWorker();
      show({ canImport: true });
      await importPage();
      assert.deepEqual(
        screen.getAllByTestId<HTMLTextAreaElement>('StepText-field').map((i) => i.value),
        ['Snijd de ui.', 'Kook 20 minuten.', ''],
      );
    });

    test('only the two fetch endpoints are called: nothing is saved', async () => {
      const stub = stubWorker();
      show({ canImport: true });
      await importPage();
      assert.deepEqual(askedFor(stub), ['/importeren/pagina', '/importeren/foto']);
    });
  });

  describe('recipe-import › Source is the imported address', () => {
    test('the source field holds the address', async () => {
      stubWorker();
      show({ canImport: true });
      await importPage('https://example.com/soep');
      assert.equal(field('RecipeEditor-source').value, 'https://example.com/soep');
    });
  });

  describe('recipe-import › Author is not imported', () => {
    test('the author field keeps its value', async () => {
      stubWorker();
      const initial = { ...emptyDraftSeed, author: 'Mam' };
      show({ canImport: true, initial, values: initial });
      await importPage();
      assert.equal(field('AuthorInput-field').value, 'Mam');
    });
  });

  describe('recipe-import › Page without an image', () => {
    test('the form is filled and the photo field stays empty', async () => {
      const stub = stubWorker({ page: () => html(recipePage({ image: undefined })) });
      show({ canImport: true });
      await importPage();
      assert.equal(field('RecipeEditor-title').value, 'Tomatensoep');
      assert.equal(imageSrc(), undefined);
      assert.deepEqual(askedFor(stub), ['/importeren/pagina']);
    });
  });

  describe('recipe-import › Photo is imported', () => {
    test('the photo field is handed the image and shows it', async () => {
      stubWorker();
      show({ canImport: true });
      await importPage();
      assert.ok(imageSrc()?.startsWith('blob:'));
    });
  });

  describe('recipe-import › Image that cannot be used', () => {
    test('the form is filled, the photo field is empty and a message says the photo was skipped', async () => {
      stubWorker({ image: () => new Response(null, { status: 415 }) });
      show({ canImport: true });
      await importPage();
      assert.equal(field('RecipeEditor-title').value, 'Tomatensoep');
      assert.equal(imageSrc(), undefined);
      assert.ok(screen.getByTestId('RecipeEditor-photoSkipped'));
    });

    test('the message goes when the form is reset', async () => {
      stubWorker({ image: () => new Response(null, { status: 502 }) });
      show({ canImport: true });
      await importPage();
      fireEvent.click(screen.getByTestId('SaveBar-reset'));
      fireEvent.click(screen.getByTestId('SaveBar-confirm'));
      assert.equal(screen.queryByTestId('RecipeEditor-photoSkipped'), null);
    });
  });

  describe('recipe-import › Import is offered only on an untouched form', () => {
    test('the import field is offered on an untouched form', () => {
      show({ canImport: true });
      assert.ok(screen.getByTestId('ImportBox-address'));
    });

    test('it is gone once the member typed something', () => {
      show({ canImport: true });
      fireEvent.change(field('RecipeEditor-title'), { target: { value: 'Eigen recept' } });
      assert.equal(screen.queryByTestId('ImportBox-address'), null);
    });

    test('it is gone after an import', async () => {
      stubWorker();
      show({ canImport: true });
      await importPage();
      assert.equal(screen.queryByTestId('ImportBox-address'), null);
    });

    test('it returns when the form is reset', async () => {
      stubWorker();
      show({ canImport: true });
      await importPage();
      fireEvent.click(screen.getByTestId('SaveBar-reset'));
      fireEvent.click(screen.getByTestId('SaveBar-confirm'));
      assert.ok(screen.getByTestId('ImportBox-address'));
      assert.equal(field('RecipeEditor-title').value, '');
    });

    test('a failed import leaves the field in place', async () => {
      stubWorker({ page: () => new Response(null, { status: 502 }) });
      show({ canImport: true });
      await importPage();
      assert.ok(screen.getByTestId('ImportBox-address'));
    });
  });

  describe('recipe-import › Import is not offered when editing', () => {
    test('an editor without the import option has no import field', () => {
      show({ slug: 'appeltaart' });
      assert.equal(screen.queryByTestId('ImportBox-address'), null);
    });
  });

  describe('recipe-import › Imported content is kept as a draft', () => {
    test('the imported content is back after the page is opened again', async () => {
      stubWorker();
      show({ canImport: true });
      await importPage();
      cleanup();
      show({ canImport: true });
      assert.equal(field('RecipeEditor-title').value, 'Tomatensoep');
    });
  });
});
