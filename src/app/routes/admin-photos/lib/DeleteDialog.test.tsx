import assert from 'node:assert/strict';
import { createRef } from 'react';
import { describe, test } from 'vitest';
import { fireEvent, render, screen } from '~testing/dom';
import { DeleteDialog } from './DeleteDialog';
import { formatSize, photoCount } from './format';
import type { StoredPhotoInfo } from './photos';

const photo = (n: number, extra: Partial<StoredPhotoInfo> = {}): StoredPhotoInfo => ({
  name: `${n}.jpg`,
  size: 200_000,
  uploaded: new Date('2026-03-14T10:00:00Z'),
  recent: false,
  recipe: null,
  ...extra,
});
const show = (photos: StoredPhotoInfo[]) => {
  const ref = createRef<HTMLDialogElement>();
  const calls = { cancel: 0, confirm: 0 };
  render(<DeleteDialog ref={ref} photos={photos} onCancel={() => calls.cancel++} onConfirm={() => calls.confirm++} />);
  return { calls, dialog: screen.getByTestId<HTMLDialogElement>('DeleteDialog-dialog') };
};
const warning = () => screen.queryByTestId('DeleteDialog-warning');

describe('orphaned-photos › Deleting asks to confirm', () => {
  test('shows the number and total size of the photos', () => {
    show([photo(1), photo(2)]);
    assert.ok(screen.getByTestId('DeleteDialog-summary').textContent?.includes(photoCount(2)));
    assert.ok(screen.getByTestId('DeleteDialog-summary').textContent?.includes(formatSize(400_000)));
  });

  test('names the number on the confirm button', () => {
    show([photo(1), photo(2)]);
    assert.ok(screen.getByTestId('DeleteDialog-confirm').textContent?.includes(photoCount(2)));
  });
});

describe('orphaned-photos › Warning for recent photos', () => {
  test('shows the warning when a photo is recent', () => {
    show([photo(1), photo(2, { recent: true })]);
    assert.ok(warning());
  });
});

describe('orphaned-photos › No warning without recent photos', () => {
  test('shows no warning', () => {
    show([photo(1)]);
    assert.equal(warning(), null);
  });
});

describe('orphaned-photos › Cancelling', () => {
  test('"Annuleer" cancels', () => {
    const { calls } = show([photo(1)]);
    fireEvent.click(screen.getByTestId('DeleteDialog-cancel'));
    assert.deepEqual(calls, { cancel: 1, confirm: 0 });
  });

  test('a click outside the box closes the dialog', () => {
    const { dialog } = show([photo(1)]);
    dialog.open = true;
    fireEvent.click(dialog, { clientX: 5, clientY: 5 });
    assert.equal(dialog.open, false);
  });

  test('a click inside the box leaves the dialog open', () => {
    const { dialog } = show([photo(1)]);
    dialog.open = true;
    fireEvent.click(screen.getByTestId('DeleteDialog-title'));
    assert.equal(dialog.open, true);
  });

  test('"Annuleer" has focus when the dialog opens', () => {
    show([photo(1)]);
    assert.equal(document.activeElement, screen.getByTestId('DeleteDialog-cancel'));
  });
});

describe('orphaned-photos › Confirming', () => {
  test('"Verwijder N foto\'s" confirms', () => {
    const { calls } = show([photo(1)]);
    fireEvent.click(screen.getByTestId('DeleteDialog-confirm'));
    assert.deepEqual(calls, { cancel: 0, confirm: 1 });
  });
});
