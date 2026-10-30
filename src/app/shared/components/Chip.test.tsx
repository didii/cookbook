import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { fireEvent, render, screen } from '~testing/dom';
import { Chip } from './Chip';

describe('Chip', () => {
  test('shows whether it is pressed', () => {
    render(
      <Chip data-testid="Chip-test" pressed>
        Ongebruikt
      </Chip>,
    );
    assert.equal(screen.getByTestId('Chip-test').getAttribute('aria-pressed'), 'true');
  });

  test('passes clicks on', () => {
    let clicks = 0;
    render(
      <Chip data-testid="Chip-test" pressed={false} onClick={() => clicks++}>
        Ongebruikt
      </Chip>,
    );
    fireEvent.click(screen.getByTestId('Chip-test'));
    assert.equal(clicks, 1);
  });
});
