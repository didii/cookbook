import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { cssFor } from '~testing/css';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { noFilters, type Filters } from '~/lib/filterRecipes';
import { FilterBar } from './FilterBar';

const authors = ['Mama', 'Oma', 'Papa'];
const render = (filters: Filters = noFilters, detailed = true) =>
  renderToStaticMarkup(createElement(FilterBar, { filters, authors, detailed, onChange: () => {} }));

/** The class attribute of the first element whose opening tag matches. */
const classOf = (html: string, tag: RegExp) => {
  const open = tag.exec(html)?.[0] ?? '';
  const classes = /class="([^"]*)"/.exec(open)?.[1];
  assert.ok(classes, `no class on ${tag}`);
  return classes;
};
const bar = (html: string) => classOf(html, /<search[^>]*>/);
const sheet = (html: string) => classOf(html, /<div id="[^"]*"[^>]*>/);
const flat = (css: string) => css.replace(/\s+/g, ' ');
/** The rules inside the 48rem media query. */
const wide = (css: string) => /@media \(width >= 48rem\) \{(.*?)\} \}/.exec(flat(css))?.[1] ?? '';

test('recipe-filtering › Scrolling on a phone', async () => {
  const css = flat(await cssFor(bar(render())));
  // Fixed to the bottom edge (above the keyboard offset) and clear of the safe area, in the base (phone) rules.
  assert.match(css, /\.fixed \{ position: fixed; \}/);
  assert.match(css, /bottom: var\(--kb,0px\)/);
  assert.match(css, /padding-bottom: calc\(.*env\(safe-area-inset-bottom\)\)/);
  // The search box is the last thing in the bar, so the bar's bottom edge is the box's edge.
  const html = render();
  assert.ok(html.indexOf('type="search"') > html.indexOf('Van wie'));
});

test('search box and Filter button are at least 48px high with text of at least 16px', async () => {
  const html = render();
  for (const tag of [/<input type="search"[^>]*>/, /<button[^>]*aria-controls[^>]*>/]) {
    const classes = classOf(html, tag);
    const css = flat(await cssFor(classes));
    assert.match(css, /min-height: calc\(var\(--spacing\) \* 12\)/);
    assert.match(css, /font-size: var\(--text-base\)/);
  }
});

test('recipe-filtering › Search box stays put', async () => {
  const html = render();
  // The sheet comes before the search box inside the bar, and the bar is anchored at the bottom, so the sheet grows upward.
  assert.ok(html.indexOf('id="') < html.indexOf('type="search"'));
  const css = flat(await cssFor(`${bar(html)} ${sheet(html)}`));
  assert.match(css, /bottom: var\(--kb,0px\)/);
  assert.doesNotMatch(css, /[^-]top: /);
  // A 3px line in a faint ink colour separates them, below 48rem only.
  assert.match(css, /max-md\\:border-b-3[^{]*\{[^}]*border-bottom-width: 3px/);
  assert.match(css, /max-md\\:border-ink\\\/15[^{]*\{[^}]*color-mix\(in oklab, var\(--color-ink\) 15%/);
  assert.doesNotMatch(wide(await cssFor(sheet(html))), /border-bottom-width/);
});

test('recipe-filtering › Reduced motion', async () => {
  const css = flat(await cssFor(sheet(render())));
  // The sheet rises in 0.22 s when open, and not at all when the person prefers reduced motion.
  assert.match(css, /data-open[^{]*\{[^}]*animation: var\(--animate-rise\)/);
  assert.match(readFileSync(new URL('../../app.css', import.meta.url), 'utf8'), /--animate-rise: rise 0\.22s/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{[^@]*animation: none/);
});

test('recipe-filtering › Selected and unselected chips', async () => {
  const html = render({ ...noFilters, author: 'Oma' });
  assert.equal(html.match(/aria-pressed="true"/g)?.length, 1);
  assert.match(html, /aria-pressed="true"[^>]*>Oma</);
  const chip = classOf(html, /<button[^>]*aria-pressed="false"[^>]*>/);
  const css = flat(await cssFor(chip));
  // Unselected: dashed, no fill, no shadow. Selected: solid, dark fill, white text.
  assert.match(css, /border-style: dashed/);
  assert.match(css, /background-color: transparent/);
  assert.doesNotMatch(css, /box-shadow/);
  assert.match(css, /aria-pressed[^{]*\{[^}]*border-style: solid/);
  assert.match(css, /aria-pressed[^{]*\{[^}]*background-color: var\(--color-ink\)/);
  assert.match(css, /aria-pressed[^{]*\{[^}]*color: var\(--color-white\)/);
});

test('recipe-filtering › Active filter count', () => {
  const dot = (filters: Filters) => /<button[^>]*aria-controls[^>]*>.*?<\/button>/.exec(render(filters))?.[0] ?? '';
  assert.match(dot({ q: '', author: 'Oma', sort: 'az' }), />2<span class="sr-only"> actief<\/span>/);
  assert.match(dot({ q: '', author: 'Oma', sort: 'nieuwste' }), />1</);
  // Nothing active, or only a search text: no number.
  assert.doesNotMatch(dot({ ...noFilters, q: 'appel' }), /actief/);
});

test('recipe-filtering › Wide screen', async () => {
  const html = render();
  // From 48rem the bar is in the flow with the search box above the chips, nothing is fixed, the sheet is always shown and the Filter button is gone.
  const barRules = wide(await cssFor(bar(html)));
  assert.match(barRules, /position: static/);
  assert.match(barRules, /flex-direction: column-reverse/);
  assert.match(wide(await cssFor(sheet(html))), /display: block/);
  assert.match(wide(await cssFor(classOf(html, /<button[^>]*aria-controls[^>]*>/))), /display: none/);
});

test('the sheet starts closed and the Filter button controls it', () => {
  const html = render();
  const id = /<div id="([^"]*)"/.exec(html)?.[1];
  assert.ok(id);
  assert.match(html, new RegExp(`aria-expanded="false"[^>]*aria-controls="${id}"|aria-controls="${id}"[^>]*aria-expanded="false"`));
  assert.doesNotMatch(sheet(html).split(' ').join('\n'), /^block$/m);
  assert.doesNotMatch(html, / data-open=/);
});

test('with few recipes only the search box is offered', () => {
  const html = render(noFilters, false);
  assert.match(html, /type="search"/);
  assert.doesNotMatch(html, /aria-pressed|type="radio"|aria-controls|Wis filters/);
});

test('the chosen order is checked, and Iedereen is chosen by default', () => {
  const html = render({ ...noFilters, sort: 'az' });
  assert.match(html, /<input[^>]*-az"[^>]*checked=""/);
  assert.doesNotMatch(html, /<input[^>]*-nieuwste"[^>]*checked=""/);
  assert.match(render(), /aria-pressed="true"[^>]*>Iedereen</);
});

test('button-press › Pressing a chip', async () => {
  const html = render();
  // Chips and the segments of the sort control have no hard shadow, so nothing in their classes moves or unshadows them on :active.
  const classes = [classOf(html, /<button[^>]*aria-pressed[^>]*>/), classOf(html, /<label[^>]*>/)].join(' ');
  const css = await cssFor(classes);
  assert.doesNotMatch(css, /:active/);
  assert.doesNotMatch(css, /translate|box-shadow|shadow-hard/);
  // The Filter button and "Wis filters", which do have a shadow, are the ones that press.
  assert.match(await cssFor(classOf(html, /<button[^>]*aria-controls[^>]*>/)), /:active/);
});

// A real browser is needed: opening the sheet is a click, and the search box must not move on screen.
test.todo('recipe-filtering › Opening the sheet');
// A real browser is needed: pressing Filter again or Escape closes the sheet, and focus returns to the Filter button.
test.todo('recipe-filtering › Closing the sheet');
