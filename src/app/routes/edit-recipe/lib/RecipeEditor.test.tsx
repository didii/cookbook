import assert from 'node:assert/strict';
import type { ComponentProps } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, test, vi } from 'vitest';
import { defaultRules } from '~app/shared/rules';
import { act, cleanup, fireEvent, openAutocomplete, precedes, render, screen } from '~testing/dom';
import { emptyDraftSeed, startingDraft } from './draft';
import { browserStorage, draftKey, saveDraft } from './draftStore';
import type { ImportedRecipe } from './import/readRecipe';
import { RecipeEditor } from './RecipeEditor';
import { limits } from './recipeValidation';
import { formatTime, servingsFrom } from './toDraftSeed';

// The import box, the image fetch and the photo field have their own tests. Here they are stand-ins, so these tests cover only how the editor wires them.
const mocks = vi.hoisted(() => ({
  imported: undefined as import('./import/readRecipe').ImportedRecipe | undefined,
  address: '',
  fetchImage: vi.fn<(url: string) => Promise<Blob | undefined>>(),
  incoming: undefined as { blob: Blob } | undefined,
}));
vi.mock('./import/ImportBox', () => ({
  ImportBox: ({ onImported }: { onImported: (imported: unknown, address: string) => void }) => (
    <button type="button" aria-label="import" data-testid="ImportBox-import" onClick={() => onImported(mocks.imported, mocks.address)} />
  ),
}));
vi.mock('./import/fetchImage', () => ({ fetchImage: mocks.fetchImage }));
vi.mock('./photo/PhotoField', () => ({
  PhotoField: ({ incoming, onStateChange }: { incoming?: { blob: Blob }; onStateChange: (state: string) => void }) => {
    mocks.incoming = incoming;
    return (
      <button
        type="button"
        aria-label="pick"
        data-testid="PhotoField-pick"
        data-incoming={String(!!incoming)}
        onClick={() => onStateChange('uploading')}
      />
    );
  },
}));

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
  const imported: ImportedRecipe = {
    title: 'Tomatensoep',
    intro: 'Een klassieker.',
    servingsText: '4 porties',
    minutes: 80,
    ingredients: ['500 g tomaten', '1 ui'],
    steps: ['Snijd de ui.', 'Kook 20 minuten.'],
    image: 'https://example.com/soep.jpg',
  };
  const address = 'https://example.com/soep';
  const image = new Blob(['image']);
  const field = (id: string) => screen.getByTestId<HTMLInputElement>(id);
  const importNow = async (recipe: Partial<ImportedRecipe> = {}) => {
    mocks.imported = { ...imported, ...recipe };
    mocks.address = address;
    await act(async () => void fireEvent.click(screen.getByTestId('ImportBox-import')));
  };
  const reset = () => {
    fireEvent.click(screen.getByTestId('SaveBar-reset'));
    fireEvent.click(screen.getByTestId('SaveBar-confirm'));
  };

  beforeEach(() => {
    mocks.fetchImage.mockReset().mockResolvedValue(image);
    mocks.incoming = undefined;
  });

  describe('recipe-import › Form is prefilled', () => {
    test('the title and intro are filled in', async () => {
      show({ canImport: true });
      await importNow();
      assert.equal(field('RecipeEditor-title').value, imported.title);
      assert.equal(field('RecipeEditor-intro').value, imported.intro);
    });

    test('the servings and time are filled in', async () => {
      show({ canImport: true });
      await importNow();
      assert.equal(field('RecipeEditor-servings').value, servingsFrom(imported.servingsText));
      assert.equal(field('RecipeEditor-time').value, formatTime(imported.minutes));
    });

    test('the ingredients are filled in, followed by the free row', async () => {
      show({ canImport: true });
      await importNow();
      assert.deepEqual(
        screen.getAllByTestId<HTMLInputElement>('IngredientItem-field').map((i) => i.value),
        [...imported.ingredients, ''],
      );
    });

    test('the steps are filled in, followed by the free step', async () => {
      show({ canImport: true });
      await importNow();
      assert.deepEqual(
        screen.getAllByTestId<HTMLTextAreaElement>('StepText-field').map((i) => i.value),
        [...imported.steps, ''],
      );
    });
  });

  describe('recipe-import › Source is the imported address', () => {
    test('the source field holds the address', async () => {
      show({ canImport: true });
      await importNow();
      assert.equal(field('RecipeEditor-source').value, address);
    });
  });

  describe('recipe-import › Author is not imported', () => {
    test('the author field keeps its value', async () => {
      const initial = { ...emptyDraftSeed, author: 'Mam' };
      show({ canImport: true, initial, values: initial });
      await importNow();
      assert.equal(field('AuthorInput-field').value, 'Mam');
    });
  });

  describe('recipe-import › Page without an image', () => {
    test('the form is filled and no image is fetched or handed over', async () => {
      show({ canImport: true });
      await importNow({ image: undefined });
      assert.equal(field('RecipeEditor-title').value, imported.title);
      assert.equal(mocks.fetchImage.mock.calls.length, 0);
      assert.equal(mocks.incoming, undefined);
    });
  });

  describe('recipe-import › Photo is imported', () => {
    test('the image address is fetched', async () => {
      show({ canImport: true });
      await importNow();
      assert.deepEqual(mocks.fetchImage.mock.calls, [[imported.image]]);
    });

    test('the fetched image is handed to the photo field', async () => {
      show({ canImport: true });
      await importNow();
      assert.equal(mocks.incoming?.blob, image);
    });
  });

  describe('recipe-import › Image that cannot be used', () => {
    test('the form is still filled, nothing is handed over and a message says the photo was skipped', async () => {
      mocks.fetchImage.mockResolvedValue(undefined);
      show({ canImport: true });
      await importNow();
      assert.equal(field('RecipeEditor-title').value, imported.title);
      assert.equal(mocks.incoming, undefined);
      assert.ok(screen.getByTestId('RecipeEditor-photoSkipped'));
    });

    test('the message goes when the form is reset', async () => {
      mocks.fetchImage.mockResolvedValue(undefined);
      show({ canImport: true });
      await importNow();
      reset();
      assert.equal(screen.queryByTestId('RecipeEditor-photoSkipped'), null);
    });

    test('the message goes with the next photo action', async () => {
      mocks.fetchImage.mockResolvedValue(undefined);
      show({ canImport: true });
      await importNow();
      fireEvent.click(screen.getByTestId('PhotoField-pick'));
      assert.equal(screen.queryByTestId('RecipeEditor-photoSkipped'), null);
    });
  });

  describe('recipe-import › Form waits for an import', () => {
    test('the form is not shown yet', () => {
      show({ canImport: true });
      assert.equal(screen.queryByTestId('RecipeEditor-form'), null);
    });

    test('a link leads to the plain new recipe form', () => {
      show({ canImport: true });
      assert.equal(screen.getByTestId('RecipeEditor-typeItself').getAttribute('href'), '/recepten/nieuw');
    });

    test('the form is shown after an import', async () => {
      show({ canImport: true });
      await importNow();
      assert.ok(screen.getByTestId('RecipeEditor-form'));
    });
  });

  describe('recipe-import › Import is offered only on an untouched form', () => {
    test('the import box is offered on an untouched form', () => {
      show({ canImport: true });
      assert.ok(screen.getByTestId('ImportBox-import'));
    });

    test('it is gone once the form holds changes', () => {
      const initial = { ...emptyDraftSeed, title: 'Oud' };
      show({ canImport: true, initial, values: { ...initial, title: 'Eigen recept' } });
      assert.equal(screen.queryByTestId('ImportBox-import'), null);
      assert.ok(screen.getByTestId('RecipeEditor-form'));
    });

    test('it is gone after an import', async () => {
      show({ canImport: true });
      await importNow();
      assert.equal(screen.queryByTestId('ImportBox-import'), null);
      assert.equal(screen.queryByTestId('RecipeEditor-typeItself'), null);
    });

    test('it returns instead of the form when the form is reset', async () => {
      show({ canImport: true });
      await importNow();
      reset();
      assert.ok(screen.getByTestId('ImportBox-import'));
      assert.equal(screen.queryByTestId('RecipeEditor-form'), null);
    });

    test('a reset drops an image that arrives afterwards', async () => {
      let arrive: (blob: Blob) => void = () => undefined;
      mocks.fetchImage.mockReturnValue(new Promise((resolve) => (arrive = resolve)));
      show({ canImport: true });
      await importNow();
      reset();
      await act(async () => arrive(image));
      assert.equal(mocks.incoming, undefined);
    });
  });

  describe('RecipeEditor without the import option', () => {
    test('the import box is not offered', () => {
      show();
      assert.equal(screen.queryByTestId('ImportBox-import'), null);
    });
  });

  describe('recipe-import › Imported content is kept as a draft', () => {
    test('the imported content is back after the page is opened again', async () => {
      show({ canImport: true });
      await importNow();
      cleanup();
      show({ canImport: true });
      fireEvent.click(screen.getByTestId('RestoreDraftDialog-use'));
      assert.equal(field('RecipeEditor-title').value, imported.title);
    });
  });
});

describe('unfinished draft of a new recipe', () => {
  const keyFor = (slug?: string) => draftKey('', slug);
  /** Puts a draft of a half-written recipe on the device. */
  const keepDraft = (slug?: string) => {
    const initial = startingDraft(defaultRules, emptyDraftSeed);
    saveDraft(browserStorage(), keyFor(slug), {
      state: { ...initial, title: 'Soep van gisteren' },
      initial,
      base: {},
      uploading: false,
      settledImage: '',
      now: new Date(),
      rules: defaultRules,
    });
  };
  const title = () => screen.getByTestId<HTMLInputElement>('RecipeEditor-title').value;

  describe('recipe-draft › An unfinished new recipe returns', () => {
    test('a popup asks about the draft', () => {
      keepDraft();
      show();
      assert.ok(screen.getByTestId('RestoreDraftDialog-heading'));
    });

    test('the popup is offered the stored draft', () => {
      keepDraft();
      show();
      assert.equal(screen.getByTestId('RestoreDraftDialog-title').textContent, 'Soep van gisteren');
    });

    test('the form is not filled yet', () => {
      keepDraft();
      show();
      assert.equal(title(), '');
    });
  });

  describe('recipe-draft › Using the draft', () => {
    test('the popup closes', () => {
      keepDraft();
      show();
      fireEvent.click(screen.getByTestId('RestoreDraftDialog-use'));
      assert.equal(screen.queryByTestId('RestoreDraftDialog-heading'), null);
    });

    test('the form shows what was written', () => {
      keepDraft();
      show();
      fireEvent.click(screen.getByTestId('RestoreDraftDialog-use'));
      assert.equal(title(), 'Soep van gisteren');
    });

    test('the save bar says a draft was restored', () => {
      keepDraft();
      show();
      fireEvent.click(screen.getByTestId('RestoreDraftDialog-use'));
      assert.ok(screen.getByTestId('RecipeEditor-restored'));
    });
  });

  describe('recipe-draft › Discarding the draft', () => {
    test('the popup closes and the form is empty', () => {
      keepDraft();
      show();
      fireEvent.click(screen.getByTestId('RestoreDraftDialog-discard'));
      assert.equal(screen.queryByTestId('RestoreDraftDialog-heading'), null);
      assert.equal(title(), '');
    });

    test('the draft is removed from the device', () => {
      keepDraft();
      show();
      fireEvent.click(screen.getByTestId('RestoreDraftDialog-discard'));
      assert.equal(localStorage.getItem(keyFor()), null);
    });

    test('on the import page the import box is shown', () => {
      keepDraft();
      show({ canImport: true });
      fireEvent.click(screen.getByTestId('RestoreDraftDialog-discard'));
      assert.ok(screen.getByTestId('ImportBox-import'));
    });
  });

  describe('recipe-draft › The popup cannot be dismissed without a choice', () => {
    test('Escape leaves the offered draft on the device', () => {
      keepDraft();
      const offered = localStorage.getItem(keyFor());
      show();
      fireEvent(screen.getByTestId('RestoreDraftDialog-dialog'), new Event('cancel', { cancelable: true }));
      assert.equal(localStorage.getItem(keyFor()), offered);
    });
  });

  describe('recipe-draft › Nothing is written before the choice', () => {
    test('hiding the page leaves the offered draft unchanged', () => {
      keepDraft();
      const offered = localStorage.getItem(keyFor());
      show();
      window.dispatchEvent(new Event('pagehide'));
      assert.equal(localStorage.getItem(keyFor()), offered);
    });

    test('closing the editor leaves the offered draft unchanged', () => {
      keepDraft();
      const offered = localStorage.getItem(keyFor());
      show();
      cleanup();
      assert.equal(localStorage.getItem(keyFor()), offered);
    });
  });

  describe('recipe-draft › A stored recipe asks nothing', () => {
    test('no popup is shown', () => {
      keepDraft('soep');
      show({ slug: 'soep' });
      assert.equal(screen.queryByTestId('RestoreDraftDialog-heading'), null);
    });

    test('the draft is restored', () => {
      keepDraft('soep');
      show({ slug: 'soep' });
      assert.equal(title(), 'Soep van gisteren');
    });
  });
});
