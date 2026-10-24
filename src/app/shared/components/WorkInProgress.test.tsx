import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { render, screen } from '~testing/dom';
import { WorkInProgress } from './WorkInProgress';

describe('WorkInProgress', () => {
  test('the banner says the screen is being built', () => {
    render(<WorkInProgress title="Titel" />);
    assert.equal(screen.getByTestId('WorkInProgress-banner').textContent, 'Dit scherm is nog in aanbouw');
  });

  test('the banner is an output element', () => {
    render(<WorkInProgress title="Titel" />);
    assert.equal(screen.getByTestId('WorkInProgress-banner').tagName, 'OUTPUT'); // implicit role status
  });

  test('shows the title as heading', () => {
    render(<WorkInProgress title="Titel" />);
    assert.equal(screen.getByRole('heading', { level: 1 }).textContent, 'Titel');
  });
});
