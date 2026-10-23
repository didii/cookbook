import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { noFilters, type Filters } from '~app/lib/filterRecipes';
import { cssFor } from '~testing/css';
import { cleanup, fireEvent, precedes, render, screen, within } from '~testing/dom';
import { FilterBar } from './FilterBar';

const authors = ['Mama', 'Oma', 'Papa'];
const show = (filters: Filters = noFilters, detailed = true) =>
  render(<FilterBar filters={filters} authors={authors} detailed={detailed} onChange={() => {}} />);

const bar = () => screen.getByTestId('FilterBar-bar');
const searchBox = () => screen.getByTestId('FilterBar-search');
const filterButton = () => screen.getByTestId('FilterBar-toggle');
const chips = () => screen.getAllByTestId('FilterBar-chip');
const chip = (name: string, root: HTMLElement = document.body) =>
  within(root)
    .getAllByTestId('FilterBar-chip')
    .find((c) => c.textContent === name)!;
const pressed = (el: Element) => el.getAttribute('aria-pressed') === 'true';
const sortInput = (value: string, root: HTMLElement = document.body) =>
  within(root)
    .getAllByTestId<HTMLInputElement>('FilterBar-sort')
    .find((i) => i.value === value)!;
/** The detailed filters: what the Filter button controls. */
const sheet = () => {
  const el = screen.getByTestId('FilterBar-sheet');
  assert.equal(filterButton().getAttribute('aria-controls'), el.id);
  return el;
};
const flat = (css: string) => css.replace(/\s+/g, ' ');
/** The rules inside the 48rem media query. */
const wide = (css: string) => /@media \(width >= 48rem\) \{(.*?)\} \}/.exec(flat(css))?.[1] ?? '';

test('recipe-filtering › Scrolling on a phone', async () => {
  show();
  const css = flat(await cssFor(bar().className));
  // Fixed to the bottom edge (above the keyboard offset) and clear of the safe area, in the base (phone) rules.
  assert.match(css, /\.fixed \{ position: fixed; \}/);
  assert.match(css, /bottom: var\(--kb,0px\)/);
  assert.match(css, /padding-bottom: calc\(.*env\(safe-area-inset-bottom\)\)/);
  // The search box is the last thing in the bar, so the bar's bottom edge is the box's edge.
  assert.ok(precedes(screen.getByTestId('FilterBar-authors'), searchBox()));
});

test('search box and Filter button are at least 48px high with text of at least 16px', async () => {
  show();
  for (const el of [searchBox(), filterButton()]) {
    const css = flat(await cssFor(el.className));
    assert.match(css, /min-height: calc\(var\(--spacing\) \* 12\)/);
    assert.match(css, /font-size: var\(--text-base\)/);
  }
});

test('recipe-filtering › Search box stays put', async () => {
  show();
  // The sheet comes before the search box inside the bar, and the bar is anchored at the bottom, so the sheet grows upward.
  assert.ok(bar().contains(sheet()) && precedes(sheet(), searchBox()));
  const css = flat(await cssFor(`${bar().className} ${sheet().className}`));
  assert.match(css, /bottom: var\(--kb,0px\)/);
  assert.doesNotMatch(css, /[^-]top: /);
  // A 3px line in a faint ink colour separates them, below 48rem only.
  assert.match(css, /max-md\\:border-b-3[^{]*\{[^}]*border-bottom-width: 3px/);
  assert.match(css, /max-md\\:border-ink\\\/15[^{]*\{[^}]*color-mix\(in oklab, var\(--color-ink\) 15%/);
  assert.doesNotMatch(wide(await cssFor(sheet().className)), /border-bottom-width/);
});

test('recipe-filtering › Reduced motion', async () => {
  show();
  const css = flat(await cssFor(sheet().className));
  // The sheet rises in 0.22 s when open, and not at all when the person prefers reduced motion.
  assert.match(css, /data-open[^{]*\{[^}]*animation: var\(--animate-rise\)/);
  assert.match(readFileSync(new URL('../../app.css', import.meta.url), 'utf8'), /--animate-rise: rise 0\.22s/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{[^@]*animation: none/);
});

test('recipe-filtering › Selected and unselected chips', async () => {
  show({ ...noFilters, author: 'Oma' });
  const selected = chips().filter(pressed);
  assert.deepEqual(
    selected.map((b) => b.textContent),
    ['Oma'],
  );
  assert.equal(pressed(chip('Mama')), false);
  const css = flat(await cssFor(chip('Mama').className));
  // Unselected: dashed, no fill, no shadow. Selected: solid, dark fill, white text.
  assert.match(css, /border-style: dashed/);
  assert.match(css, /background-color: transparent/);
  assert.doesNotMatch(css, /box-shadow/);
  assert.match(css, /aria-pressed[^{]*\{[^}]*border-style: solid/);
  assert.match(css, /aria-pressed[^{]*\{[^}]*background-color: var\(--color-red\)/);
  assert.match(css, /aria-pressed[^{]*\{[^}]*color: var\(--color-white\)/);
});

test('recipe-filtering › Active filter count', () => {
  const label = (filters: Filters) => {
    show(filters);
    const text = filterButton().textContent;
    cleanup();
    return text;
  };
  // The number, with "actief" for a screen reader.
  assert.equal(label({ q: '', author: 'Oma', sort: 'az' }), 'Filter2 actief');
  assert.equal(label({ q: '', author: 'Oma', sort: 'nieuwste' }), 'Filter1 actief');
  // Nothing active, or only a search text: no number.
  assert.equal(label({ ...noFilters, q: 'appel' }), 'Filter');
});

test('recipe-filtering › Wide screen', async () => {
  show();
  // From 48rem the bar is in the flow with the search box above the chips, nothing is fixed, the sheet is always shown and the Filter button is gone.
  const barRules = wide(await cssFor(bar().className));
  assert.match(barRules, /position: static/);
  assert.match(barRules, /flex-direction: column-reverse/);
  assert.match(wide(await cssFor(sheet().className)), /display: block/);
  assert.match(wide(await cssFor(filterButton().className)), /display: none/);
});

test('the sheet starts closed and the Filter button controls it', () => {
  show();
  assert.ok(sheet());
  assert.equal(filterButton().getAttribute('aria-expanded'), 'false');
  assert.ok(!sheet().className.split(' ').includes('block'));
  assert.equal(sheet().hasAttribute('data-open'), false);
});

test('with few recipes only the search box is offered', () => {
  const { container } = show(noFilters, false);
  assert.ok(searchBox());
  assert.equal(container.querySelector('[aria-pressed], [type=radio], [aria-controls]'), null);
  assert.equal(screen.queryByTestId('FilterBar-clear'), null);
});

test('the chosen order is checked, and Iedereen is chosen by default', () => {
  show({ ...noFilters, sort: 'az' });
  assert.equal(sortInput('az').checked, true);
  assert.equal(sortInput('nieuwste').checked, false);
  assert.equal(sortInput('az').labels?.[0]?.textContent, 'A–Z');
  assert.equal(sortInput('nieuwste').labels?.[0]?.textContent, 'Nieuwste');
  assert.equal(pressed(chip('Iedereen')), true);
});

test('button-press › Pressing a chip', async () => {
  show();
  // Chips and the segments of the sort control have no hard shadow, so nothing in their classes moves or unshadows them on :active.
  const classes = [chip('Iedereen').className, screen.getAllByTestId('FilterBar-sortLabel')[0].className].join(' ');
  const css = await cssFor(classes);
  assert.doesNotMatch(css, /:active/);
  assert.doesNotMatch(css, /translate|box-shadow|shadow-hard/);
  // The Filter button and "Wis filters", which do have a shadow, are the ones that press.
  assert.match(await cssFor(filterButton().className), /:active/);
});

// That the search box does not move on screen is layout; 'Search box stays put' covers the classes that keep it still.
test('recipe-filtering › Opening the sheet', () => {
  show();
  fireEvent.click(filterButton());
  // The sheet is open, above the search box, and the button shows it is expanded; it holds the chips, the order and "Wis filters".
  assert.equal(filterButton().getAttribute('aria-expanded'), 'true');
  assert.equal(sheet().hasAttribute('data-open'), true);
  assert.ok(precedes(sheet(), searchBox()));
  assert.ok(chip('Iedereen', sheet()));
  assert.ok(sortInput('az', sheet()));
  assert.ok(within(sheet()).getByTestId('FilterBar-clear'));
});

test('recipe-filtering › Closing the sheet', () => {
  show();
  fireEvent.click(filterButton());
  fireEvent.click(filterButton());
  assert.equal(filterButton().getAttribute('aria-expanded'), 'false');
  assert.equal(sheet().hasAttribute('data-open'), false);
  // Escape closes it too, from the search box, and focus goes back to the Filter button.
  fireEvent.click(filterButton());
  searchBox().focus();
  fireEvent.keyDown(searchBox(), { key: 'Escape' });
  assert.equal(filterButton().getAttribute('aria-expanded'), 'false');
  assert.equal(sheet().hasAttribute('data-open'), false);
  assert.equal(document.activeElement, filterButton());
});
