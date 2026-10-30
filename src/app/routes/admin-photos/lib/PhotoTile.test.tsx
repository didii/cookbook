import assert from 'node:assert/strict';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, test } from 'vitest';
import { fireEvent, render, screen } from '~testing/dom';
import { formatDate, formatSize } from './format';
import type { StoredPhotoInfo } from './photos';
import { PhotoTile } from './PhotoTile';

const base: StoredPhotoInfo = {
  name: '00000000-0000-4000-8000-000000000001.jpg',
  size: 180_000,
  uploaded: new Date('2026-03-14T10:00:00Z'),
  recent: false,
  recipe: null,
};
const show = (photo: Partial<StoredPhotoInfo> = {}, checked = false, onChange: (on: boolean) => void = () => {}) =>
  render(
    <RouterProvider
      router={createMemoryRouter([{ path: '/', element: <PhotoTile photo={{ ...base, ...photo }} checked={checked} onChange={onChange} /> }])}
    />,
  );
const taart = { title: 'Appeltaart', slug: 'appeltaart' };

describe('PhotoTile', () => {
  test('shows the date and size of the photo', () => {
    show();
    assert.equal(screen.getByTestId('PhotoTile-date').textContent, formatDate(base.uploaded));
    assert.equal(screen.getByTestId('PhotoTile-size').textContent, formatSize(base.size));
  });

  test('a free photo is a checkbox that reports its change', () => {
    const changes: boolean[] = [];
    show({}, false, (on) => changes.push(on));
    fireEvent.click(screen.getByTestId('PhotoTile-check'));
    assert.deepEqual(changes, [true]);
  });

  test('the checkbox shows whether it is selected', () => {
    show({}, true);
    assert.equal(screen.getByTestId<HTMLInputElement>('PhotoTile-check').checked, true);
  });
});

describe('orphaned-photos › Used photo cannot be selected', () => {
  test('its tile has no checkbox', () => {
    show({ recipe: taart });
    assert.equal(screen.queryByTestId('PhotoTile-check'), null);
  });
});

describe('orphaned-photos › Used photo links to its recipe', () => {
  test('its tile shows a book that links to the recipe', () => {
    show({ recipe: taart });
    assert.equal(screen.getByTestId('PhotoTile-recipe').getAttribute('href'), '/recepten/appeltaart');
  });
});

describe('orphaned-photos › Photo of a step links to its recipe', () => {
  // The recipe of a step photo is the recipe the step belongs to, so the tile gets it like any other used photo.
  test('its tile links to the recipe it is given', () => {
    show({ recipe: { title: 'Stoofvlees', slug: 'stoofvlees' } });
    assert.equal(screen.getByTestId('PhotoTile-recipe').getAttribute('href'), '/recepten/stoofvlees');
  });
});

describe('orphaned-photos › Recent photo shows a clock', () => {
  test('its tile shows a clock', () => {
    show({ recent: true });
    assert.ok(screen.getByTestId('PhotoTile-recent'));
  });

  test('the clock is no link', () => {
    show({ recent: true });
    assert.equal(screen.queryByTestId('PhotoTile-recipe'), null);
  });

  test('the tile can be selected', () => {
    show({ recent: true });
    assert.ok(screen.getByTestId('PhotoTile-check'));
  });
});

describe('orphaned-photos › Used and recent shows the book', () => {
  test('shows the book', () => {
    show({ recent: true, recipe: taart });
    assert.ok(screen.getByTestId('PhotoTile-recipe'));
  });

  test('shows no clock', () => {
    show({ recent: true, recipe: taart });
    assert.equal(screen.queryByTestId('PhotoTile-recent'), null);
  });
});
