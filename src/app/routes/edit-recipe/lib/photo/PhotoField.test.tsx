import assert from 'node:assert/strict';
import { useState } from 'react';
import { beforeEach, describe, test, vi } from 'vitest';
import { act, fireEvent, render, screen } from '~testing/dom';
import { PhotoField } from './PhotoField';
import { resizePhoto, uploadPhoto } from './photoFile';

// Shrinking needs a canvas and uploading needs the Worker: the field's own job is what is shown and reported.
vi.mock('./photoFile', () => ({ resizePhoto: vi.fn(), uploadPhoto: vi.fn() }));

const resized = new Blob(['resized'], { type: 'image/webp' });
const handed = () => ({ blob: new Blob(['handed'], { type: 'image/jpeg' }) });

beforeEach(() => {
  vi.mocked(resizePhoto).mockReset().mockResolvedValue(resized);
  vi.mocked(uploadPhoto).mockReset().mockResolvedValue('/foto/new.webp');
});

/** The field with the value held by a parent, like the editor does. Renders it, hands over the image and lets the upload finish. */
async function show(props: { value?: string; incoming?: { blob: Blob } } = {}) {
  const onPhotoChange = vi.fn();
  function Parent({ incoming }: { incoming?: { blob: Blob } }) {
    const [value, setValue] = useState(props.value ?? '');
    return (
      <PhotoField
        value={value}
        incoming={incoming}
        onPhotoChange={(path) => (onPhotoChange(path), setValue(path))}
        onStateChange={() => undefined}
        tile={0}
      />
    );
  }
  const view = render(<Parent />);
  await act(async () => view.rerender(<Parent incoming={props.incoming} />));
  return { onPhotoChange };
}

describe('recipe-photo › Handed image is shown and uploaded', () => {
  test('the field shows it at once', async () => {
    vi.mocked(uploadPhoto).mockReturnValue(new Promise(() => undefined));
    await show({ incoming: handed() });
    assert.ok(screen.getByTestId('PhotoField-image').getAttribute('src')?.startsWith('blob:'));
  });

  test('the shrunk image is uploaded', async () => {
    await show({ incoming: handed() });
    assert.equal(vi.mocked(uploadPhoto).mock.calls[0][0], resized);
  });

  test('the field reports the uploaded path', async () => {
    const { onPhotoChange } = await show({ incoming: handed() });
    assert.deepEqual(onPhotoChange.mock.calls, [['/foto/new.webp']]);
  });
});

describe('recipe-photo › Handed image replaces the current photo', () => {
  test('the field shows the handed image only', async () => {
    vi.mocked(uploadPhoto).mockReturnValue(new Promise(() => undefined));
    await show({ value: '/foto/old.webp', incoming: handed() });
    const images = screen.getAllByTestId('PhotoField-image');
    assert.equal(images.length, 1);
    assert.ok(images[0].getAttribute('src')?.startsWith('blob:'));
  });
});

describe('recipe-photo › Handed image can be removed', () => {
  test('the field is empty again and reports it', async () => {
    const { onPhotoChange } = await show({ incoming: handed() });
    fireEvent.click(screen.getByTestId('PhotoField-remove'));
    assert.equal(screen.queryByTestId('PhotoField-image'), null);
    assert.ok(screen.getByTestId('PhotoField-add'));
    assert.deepEqual(onPhotoChange.mock.lastCall, ['']);
  });
});

describe('recipe-photo › Handed image that is unreadable', () => {
  beforeEach(() => {
    vi.mocked(resizePhoto).mockRejectedValue(new Error('not an image'));
  });

  test('the field explains that the photo cannot be read', async () => {
    await show({ incoming: handed() });
    assert.ok(screen.getByTestId('PhotoField-unreadable'));
  });

  test('the field keeps what it showed before', async () => {
    const { onPhotoChange } = await show({ value: '/foto/old.webp', incoming: handed() });
    assert.equal(screen.getByTestId('PhotoField-image').getAttribute('src'), '/foto/old.webp');
    assert.equal(onPhotoChange.mock.calls.length, 0);
  });

  test('nothing is uploaded', async () => {
    await show({ incoming: handed() });
    assert.equal(vi.mocked(uploadPhoto).mock.calls.length, 0);
  });
});

describe('PhotoField', () => {
  test('a handed image is taken once, not on every render', async () => {
    const blob = new Blob(['x']);
    const { onPhotoChange } = await show({ incoming: { blob } });
    assert.equal(vi.mocked(resizePhoto).mock.calls.length, 1);
    assert.equal(onPhotoChange.mock.calls.length, 1);
  });
});

// Not automated in a component test: these need a browser (file picker, canvas, upload, layout); checked by hand in `pnpm dev`.
test.todo('recipe-photo › Chosen photo is shown at once');
test.todo('recipe-photo › Photo is stored with the recipe');
test.todo('recipe-photo › Photo can be replaced');
test.todo('recipe-photo › Photo can be removed');
test.todo('recipe-photo › Phone photo keeps its orientation');
test.todo('recipe-photo › Photo in the recipe frame');
test.todo('recipe-photo › Photo cannot be loaded');
test.todo('recipe-photo › Unreadable file');
test.todo('recipe-photo › Upload fails');
test.todo('recipe-photo › Saving waits for the upload');
