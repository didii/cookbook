import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { render, screen } from '~testing/dom';
import { routePaths } from '~testing/routes';
import AboutPage from './AboutPageRoute';

const banner = 'Dit scherm is nog in aanbouw';

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
