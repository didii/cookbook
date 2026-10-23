import assert from 'node:assert/strict';
import { test } from 'node:test';
import About from '~app/routes/about/route';
import Settings from '~app/routes/settings/route';
import { render, screen } from '~testing/dom';
import { routePaths } from '~testing/routes';

const banner = 'Dit scherm is nog in aanbouw';

// The header comes from the layout these routes sit in; here the screen itself is checked.
test('site-menu › Settings page', () => {
  assert.ok(routePaths.includes('instellingen'));
  const { container } = render(<Settings />);
  assert.equal(screen.getByTestId('WorkInProgress-banner').textContent, banner);
  assert.equal(screen.getByTestId('WorkInProgress-banner').tagName, 'OUTPUT'); // implicit role status
  assert.equal(container.querySelector('main#main h1')?.textContent, 'Instellingen');
  assert.equal(container.querySelector('input, form, button'), null);
});

test('site-menu › About page', () => {
  assert.ok(routePaths.includes('over'));
  const { container } = render(<About />);
  assert.equal(screen.getByTestId('WorkInProgress-banner').textContent, banner);
  assert.deepEqual(
    [...container.querySelectorAll('main > *')].map((el) => el.tagName),
    ['H1', 'OUTPUT'],
  );
});
