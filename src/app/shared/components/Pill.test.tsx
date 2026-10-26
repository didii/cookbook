import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { cssFor } from '~testing/css';
import { render, screen } from '~testing/dom';
import { Pill } from './Pill';

const shape = (className: string) => className.split(/\s+/).filter((c) => /^(rounded|border-2|px-|text-|leading-|font-)/.test(c));

describe('tag-management › Category pill is yellow', () => {
  test('it has a yellow background', async () => {
    render(<Pill variant="category" data-testid="pill" />);
    assert.match(await cssFor(screen.getByTestId('pill').className), /background-color: var\(--color-yel\)/);
  });

  test('it has the shape of a tag pill', () => {
    render(
      <>
        <Pill data-testid="tag" />
        <Pill variant="category" data-testid="category" />
      </>,
    );
    assert.deepEqual(shape(screen.getByTestId('category').className), shape(screen.getByTestId('tag').className));
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
