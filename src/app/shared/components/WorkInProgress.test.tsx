import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import AboutPage from '~app/routes/about/AboutPageRoute';
import SettingsPage from '~app/routes/settings/SettingsPageRoute';
import { render, screen } from '~testing/dom';
import { routePaths } from '~testing/routes';

const banner = 'Dit scherm is nog in aanbouw';

// The header comes from the layout these routes sit in; here the screen itself is checked.
describe('site-menu › Settings page', () => {
  test('the route table serves it', () => {
    assert.ok(routePaths.includes('instellingen'));
  });

  test('shows the work in progress banner', () => {
    render(<SettingsPage />);
    assert.equal(screen.getByTestId('WorkInProgress-banner').textContent, banner);
  });

  test('the banner is an output element', () => {
    render(<SettingsPage />);
    assert.equal(screen.getByTestId('WorkInProgress-banner').tagName, 'OUTPUT'); // implicit role status
  });

  test('has the Instellingen heading', () => {
    const { container } = render(<SettingsPage />);
    assert.equal(container.querySelector('main#main h1')?.textContent, 'Instellingen');
  });

  test('has no input, form or button', () => {
    const { container } = render(<SettingsPage />);
    assert.equal(container.querySelector('input, form, button'), null);
  });
});

describe('site-menu › About page', () => {
  test('the route table serves it', () => {
    assert.ok(routePaths.includes('over'));
  });

  test('shows the work in progress banner', () => {
    render(<AboutPage />);
    assert.equal(screen.getByTestId('WorkInProgress-banner').textContent, banner);
  });

  test('has only a heading and the banner', () => {
    const { container } = render(<AboutPage />);
    assert.deepEqual(
      [...container.querySelectorAll('main > *')].map((el) => el.tagName),
      ['H1', 'OUTPUT'],
    );
  });
});
