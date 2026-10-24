import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { render, screen } from '~testing/dom';
import { routePaths } from '~testing/routes';
import SettingsPage from './SettingsPageRoute';

describe('site-menu › Settings page', () => {
  test('the route table serves it', () => {
    assert.ok(routePaths.includes('instellingen'));
  });

  test('shows the work in progress banner', () => {
    render(<SettingsPage />);
    assert.ok(screen.getByTestId('WorkInProgress-banner'));
  });

  test('has a heading', () => {
    const { container } = render(<SettingsPage />);
    assert.ok(container.querySelector('main#main h1'));
  });

  test('has no input, form or button', () => {
    const { container } = render(<SettingsPage />);
    assert.equal(container.querySelector('input, form, button'), null);
  });
});
