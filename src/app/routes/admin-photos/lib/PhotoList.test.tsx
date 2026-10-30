import assert from 'node:assert/strict';
import { createMemoryRouter, data, RouterProvider, useLoaderData } from 'react-router';
import { describe, test } from 'vitest';
import { fireEvent, render, screen, waitFor } from '~testing/dom';
import { formatSize, photoCount } from './format';
import { PhotoList } from './PhotoList';
import { photoCap, readFilters, type DeleteResult, type StoredPhotoInfo } from './photos';

type PhotoListProps = Parameters<typeof PhotoList>[0];
const photo = (n: number, extra: Partial<StoredPhotoInfo> = {}): StoredPhotoInfo => ({
  name: `${n}.jpg`,
  size: 100_000 * n,
  uploaded: new Date('2026-03-14T10:00:00Z'),
  recent: false,
  recipe: null,
  ...extra,
});
const taart = { title: 'Appeltaart', slug: 'appeltaart' };

type Page = { photos: StoredPhotoInfo[]; matches?: number };
/** The list inside a data router: the loader hands out `page` (which a test may change) and the action records the names it gets and answers `answer`. */
function show(page: Page, answer: DeleteResult = { deleted: 0, kept: [] }, url = '/') {
  const sent: string[][] = [];
  const router = createMemoryRouter(
    [
      {
        path: '/',
        loader: ({ request }) => ({ ...page, matches: page.matches ?? page.photos.length, filters: readFilters(new URL(request.url).searchParams) }),
        action: async ({ request }) => {
          sent.push(new URLSearchParams(await request.text()).getAll('naam'));
          return data(answer);
        },
        HydrateFallback: () => null,
        Component: () => {
          const { photos, matches, filters } = useLoaderData() as PhotoListProps;
          return <PhotoList photos={photos} matches={matches} filters={filters} />;
        },
      },
    ],
    { initialEntries: [url] },
  );
  render(<RouterProvider router={router} />);
  return { sent, router };
}
const checks = () => screen.findAllByTestId<HTMLInputElement>('PhotoTile-check');
const text = (id: string) => screen.getByTestId(id).textContent;
const dialog = () => screen.getByTestId<HTMLDialogElement>('DeleteDialog-dialog');
const choose = async (...indexes: number[]) => {
  const boxes = await checks();
  for (const i of indexes) fireEvent.click(boxes[i]!);
};
const ask = async (...indexes: number[]) => {
  await choose(...indexes);
  fireEvent.click(screen.getByTestId('PhotoList-delete'));
};

describe('orphaned-photos › Used photo cannot be selected', () => {
  test('"Alles selecteren" does not take it', async () => {
    show({ photos: [photo(1), photo(2, { recipe: taart })] });
    fireEvent.click(await screen.findByTestId('PhotoList-all'));
    assert.equal(text('PhotoList-count'), "1/1 foto's");
  });
});

describe('orphaned-photos › Totals', () => {
  test('shows how many are selected out of how many there are', async () => {
    show({ photos: [photo(1), photo(2), photo(3)] });
    await choose(0, 2);
    assert.equal(text('PhotoList-count'), "2/3 foto's");
  });

  test('shows the size of the selection out of the total size', async () => {
    show({ photos: [photo(1), photo(2), photo(3)] });
    await choose(0, 2);
    assert.equal(text('PhotoList-bytes'), `${formatSize(400_000)} / ${formatSize(600_000)}`);
  });
});

describe('orphaned-photos › Select all', () => {
  test('selects every selectable photo', async () => {
    show({ photos: [photo(1), photo(2), photo(3)] });
    fireEvent.click(await screen.findByTestId('PhotoList-all'));
    assert.deepEqual(
      (await checks()).map((c) => c.checked),
      [true, true, true],
    );
  });

  test('the count and size follow', async () => {
    show({ photos: [photo(1), photo(2), photo(3)] });
    fireEvent.click(await screen.findByTestId('PhotoList-all'));
    assert.equal(text('PhotoList-count'), "3/3 foto's");
    assert.equal(text('PhotoList-bytes'), `${formatSize(600_000)} / ${formatSize(600_000)}`);
  });
});

describe('orphaned-photos › Select none', () => {
  test('selects no photo', async () => {
    show({ photos: [photo(1), photo(2)] });
    fireEvent.click(await screen.findByTestId('PhotoList-all'));
    fireEvent.click(screen.getByTestId('PhotoList-none'));
    assert.deepEqual(
      (await checks()).map((c) => c.checked),
      [false, false],
    );
  });
});

describe('orphaned-photos › Used photos are counted apart', () => {
  test('says how many are in use', async () => {
    show({ photos: [photo(1), photo(2, { recipe: taart }), photo(3, { recipe: taart })] });
    await screen.findByTestId('PhotoList-count');
    assert.ok(text('PhotoList-inUse')?.includes('2'));
  });

  test('leaves them out of the counts and sizes', async () => {
    show({ photos: [photo(1), photo(2, { recipe: taart })] });
    await screen.findByTestId('PhotoList-count');
    assert.equal(text('PhotoList-count'), "0/1 foto's");
    assert.equal(text('PhotoList-bytes'), `${formatSize(0)} / ${formatSize(100_000)}`);
  });

  test('says nothing about use when no photo is used', async () => {
    show({ photos: [photo(1)] });
    await screen.findByTestId('PhotoList-count');
    assert.equal(screen.queryByTestId('PhotoList-inUse'), null);
  });
});

describe('orphaned-photos › Changing a filter clears the selection', () => {
  test('no photo is selected afterwards', async () => {
    show({ photos: [photo(1), photo(2)] });
    await choose(0, 1);
    fireEvent.click(screen.getByTestId('PhotoList-old'));
    assert.deepEqual(
      (await checks()).map((c) => c.checked),
      [false, false],
    );
  });
});

describe('orphaned-photos › Filters are in the address', () => {
  test('turning a filter off puts it in the address', async () => {
    const { router } = show({ photos: [photo(1)] });
    fireEvent.click(await screen.findByTestId('PhotoList-unused'));
    await waitFor(() => assert.equal(router.state.location.search, '?ongebruikt=0'));
  });

  test('a filter that is off in the address is shown as off', async () => {
    show({ photos: [photo(1)] }, undefined, '/?ouder=0');
    await screen.findByTestId('PhotoList-count');
    assert.equal(screen.getByTestId('PhotoList-old').getAttribute('aria-pressed'), 'false');
    assert.equal(screen.getByTestId('PhotoList-unused').getAttribute('aria-pressed'), 'true');
  });
});

describe('orphaned-photos › Only 100 are shown', () => {
  test('says how many are shown out of how many match', async () => {
    const photos = Array.from({ length: photoCap }, (_, i) => photo(i + 1));
    show({ photos, matches: 137 });
    await screen.findByTestId('PhotoList-count');
    const note = text('PhotoList-cap') ?? '';
    assert.ok(note.includes(String(photoCap)) && note.includes('137'));
  });

  test('says nothing when all matches are shown', async () => {
    show({ photos: [photo(1)] });
    await screen.findByTestId('PhotoList-count');
    assert.equal(screen.queryByTestId('PhotoList-cap'), null);
  });
});

describe('orphaned-photos › Nothing to show', () => {
  test('says so', async () => {
    show({ photos: [] });
    assert.ok(await screen.findByTestId('PhotoList-empty'));
  });

  test('keeps the filters available', async () => {
    show({ photos: [] });
    await screen.findByTestId('PhotoList-empty');
    assert.ok(screen.getByTestId('PhotoList-unused') && screen.getByTestId('PhotoList-old'));
  });

  test('offers no delete button', async () => {
    show({ photos: [] });
    await screen.findByTestId('PhotoList-empty');
    assert.equal(screen.queryByTestId('PhotoList-delete'), null);
  });
});

describe('orphaned-photos › Deleting asks to confirm', () => {
  test('opens the dialog with the selected photos', async () => {
    show({ photos: [photo(1), photo(2), photo(3)] });
    await ask(0, 1);
    assert.equal(dialog().open, true);
    assert.ok(text('DeleteDialog-summary')?.includes(photoCount(2)));
  });

  test('deletes nothing yet', async () => {
    const { sent } = show({ photos: [photo(1)] });
    await ask(0);
    await waitFor(() => assert.equal(dialog().open, true));
    assert.deepEqual(sent, []);
  });

  test('the delete button waits for a selection', async () => {
    show({ photos: [photo(1)] });
    await checks();
    assert.equal(screen.getByTestId<HTMLButtonElement>('PhotoList-delete').disabled, true);
  });
});

describe('orphaned-photos › Warning for recent photos', () => {
  test('the dialog gets the recent photo', async () => {
    show({ photos: [photo(1), photo(2, { recent: true })] });
    await ask(0, 1);
    assert.ok(screen.queryByTestId('DeleteDialog-warning'));
  });
});

describe('orphaned-photos › No warning without recent photos', () => {
  test('a recent photo that is not selected gives no warning', async () => {
    show({ photos: [photo(1), photo(2, { recent: true })] });
    await ask(0);
    assert.equal(screen.queryByTestId('DeleteDialog-warning'), null);
  });
});

describe('orphaned-photos › Cancelling', () => {
  test('"Annuleer" closes the dialog and deletes nothing', async () => {
    const { sent } = show({ photos: [photo(1)] });
    await ask(0);
    fireEvent.click(screen.getByTestId('DeleteDialog-cancel'));
    assert.equal(dialog().open, false);
    assert.deepEqual(sent, []);
  });
});

describe('orphaned-photos › Confirming', () => {
  test('sends the names of the selected photos', async () => {
    const { sent } = show({ photos: [photo(1), photo(2), photo(3)] });
    await ask(0, 2);
    fireEvent.click(screen.getByTestId('DeleteDialog-confirm'));
    await waitFor(() => assert.deepEqual(sent, [['1.jpg', '3.jpg']]));
  });

  test('closes the dialog', async () => {
    show({ photos: [photo(1)] });
    await ask(0);
    fireEvent.click(screen.getByTestId('DeleteDialog-confirm'));
    assert.equal(dialog().open, false);
  });
});

describe('orphaned-photos › All listed photos are deleted', () => {
  test('sends every selectable photo and none that is used', async () => {
    const { sent } = show({ photos: [photo(1), photo(2, { recipe: taart }), photo(3)] });
    fireEvent.click(await screen.findByTestId('PhotoList-all'));
    fireEvent.click(screen.getByTestId('PhotoList-delete'));
    fireEvent.click(screen.getByTestId('DeleteDialog-confirm'));
    await waitFor(() => assert.deepEqual(sent, [['1.jpg', '3.jpg']]));
  });
});

describe('orphaned-photos › Result is reported', () => {
  test('says how many photos were deleted', async () => {
    show({ photos: [photo(1), photo(2)] }, { deleted: 2, kept: [] });
    await ask(0, 1);
    fireEvent.click(screen.getByTestId('DeleteDialog-confirm'));
    await waitFor(() => assert.ok(text('PhotoList-deleted')?.includes(photoCount(2))));
  });

  test('says nothing about kept photos when none were kept', async () => {
    show({ photos: [photo(1)] }, { deleted: 1, kept: [] });
    await ask(0);
    fireEvent.click(screen.getByTestId('DeleteDialog-confirm'));
    await screen.findByTestId('PhotoList-deleted');
    assert.equal(screen.queryByTestId('PhotoList-kept'), null);
  });

  test('empties the selection', async () => {
    show({ photos: [photo(1), photo(2)] }, { deleted: 1, kept: [] });
    await ask(0);
    fireEvent.click(screen.getByTestId('DeleteDialog-confirm'));
    await screen.findByTestId('PhotoList-deleted');
    assert.equal(text('PhotoList-count'), "0/2 foto's");
  });
});

describe('orphaned-photos › Kept photos link to their recipes', () => {
  const kept = [taart, { title: 'Stoofvlees', slug: 'stoofvlees' }, taart];

  test('says how many were kept', async () => {
    show({ photos: [photo(1)] }, { deleted: 0, kept });
    await ask(0);
    fireEvent.click(screen.getByTestId('DeleteDialog-confirm'));
    await waitFor(() => assert.ok(text('PhotoList-kept')?.includes(photoCount(3))));
  });

  test('links to each recipe once', async () => {
    show({ photos: [photo(1)] }, { deleted: 0, kept });
    await ask(0);
    fireEvent.click(screen.getByTestId('DeleteDialog-confirm'));
    await screen.findByTestId('PhotoList-kept');
    assert.deepEqual(
      screen.getAllByTestId('PhotoList-keptLink').map((a) => a.getAttribute('href')),
      ['/recepten/appeltaart', '/recepten/stoofvlees'],
    );
  });
});

describe('orphaned-photos › Kept photo shows its recipe', () => {
  test('stays in the list as a used tile after the list is reloaded', async () => {
    const page: Page = { photos: [photo(1), photo(2)] };
    show(page, { deleted: 0, kept: [taart] });
    await ask(0);
    // A recipe started to use the photo: the reload that follows the delete lists it as used.
    page.photos = [photo(1, { recipe: taart }), photo(2)];
    fireEvent.click(screen.getByTestId('DeleteDialog-confirm'));
    await waitFor(() => assert.equal(screen.getAllByTestId('PhotoTile-recipe').length, 1));
    assert.equal(screen.getByTestId('PhotoTile-recipe').getAttribute('href'), '/recepten/appeltaart');
  });
});
