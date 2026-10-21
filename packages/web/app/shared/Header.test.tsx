import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cssFor } from '~testing/css';
import { render, screen } from '~testing/dom';
import { routePaths } from '~testing/routes';
import { MemoryRouter } from 'react-router';
import { Header } from './Header';

const show = () =>
  render(
    <MemoryRouter>
      <Header email="oma@example.com" />
    </MemoryRouter>,
  );
const flat = (css: string) => css.replace(/\s+/g, ' ');
/** The `sm` breakpoint, where the header has room for both the long link and the email. */
const fromSm = /@media \(width >= 40rem\) \{ [^{]*\{ display: (\w+)/;

test('recipe-creation › Link to the form', () => {
  show();
  assert.equal(screen.getByText('+ Nieuw').closest('a')?.getAttribute('href'), '/recepten/nieuw');
  // The route table serves it.
  assert.ok(routePaths.includes('recepten/nieuw'));
});

// The classes decide which text shows at which width; this reads them, a real width is not measured.
test('recipe-creation › Link on a narrow screen', async () => {
  show();
  // Short form below the breakpoint: hidden from it.
  const short = flat(await cssFor(screen.getByText('+ Nieuw').className));
  assert.equal(fromSm.exec(short)?.[1], 'none');
  assert.doesNotMatch(short.replace(fromSm, ''), /display: none/);
  // The long form and the email: hidden by default, shown from the breakpoint.
  for (const el of [screen.getByText('Nieuw recept', { selector: 'span' }), screen.getByText('oma@example.com')]) {
    const css = flat(await cssFor(el.className));
    assert.match(css, /\.hidden \{ display: none;/);
    assert.equal(fromSm.exec(css)?.[1], 'inline');
  }
});
