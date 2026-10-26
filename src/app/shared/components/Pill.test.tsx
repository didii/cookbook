import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { cssFor } from '~testing/css';
import { render, screen } from '~testing/dom';
import { Pill } from './Pill';

// The resolved declarations that make up the shape of a pill, not the classes that write them.
const shapeOf = async (className: string) =>
  ((await cssFor(className)).match(/(?:border-radius|border-width|padding-inline|font-size|line-height|font-weight): [^;]+;/g) ?? []).sort();

describe('tag-management › Category pill is yellow', () => {
  test('it has a yellow background', async () => {
    render(<Pill variant="category" data-testid="pill" />);
    assert.match(await cssFor(screen.getByTestId('pill').className), /background-color: var\(--color-yel\)/);
  });

  test('it has the shape of a tag pill', async () => {
    render(
      <>
        <Pill data-testid="tag" />
        <Pill variant="category" data-testid="category" />
      </>,
    );
    const category = await shapeOf(screen.getByTestId('category').className);
    assert.ok(category.length >= 5);
    assert.deepEqual(category, await shapeOf(screen.getByTestId('tag').className));
  });
});

describe('Pill', () => {
  test('a tag is cream', async () => {
    render(<Pill data-testid="pill" />);
    assert.match(await cssFor(screen.getByTestId('pill').className), /background-color: var\(--color-por\)/);
  });

  test('a className overrides the defaults', async () => {
    render(<Pill data-testid="pill" className="text-lg" />);
    assert.match(await cssFor(screen.getByTestId('pill').className), /font-size: var\(--text-lg\)/);
  });
});
