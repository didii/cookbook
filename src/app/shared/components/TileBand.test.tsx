import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { render, screen } from '~testing/dom';
import { TileBand } from './TileBand';
import { tileSteps } from '../tile';

const viewBoxes = () => screen.getAllByTestId('TileBand-band').map((band) => band.getAttribute('viewBox'));

describe('TileBand rows', () => {
  test('is one tile high by default', () => {
    render(<TileBand first={0} />);
    assert.deepEqual(viewBoxes(), ['0 0 7 1']);
  });

  test('is as many tiles high as the given rows', () => {
    render(<TileBand first={0} rows={3} />);
    assert.deepEqual(viewBoxes(), ['0 0 7 3']);
  });

  test('a responsive band has the given rows at every tile count', () => {
    render(<TileBand first={0} responsive rows={3} />);
    assert.deepEqual(
      viewBoxes(),
      tileSteps.map(([count]) => `0 0 ${count} 3`),
    );
  });
});
