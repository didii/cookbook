import assert from 'node:assert/strict';
import { beforeEach, describe, test } from 'vitest';
import { cssFor } from '~testing/css';
import { fireEvent, precedes, render, screen, within } from '~testing/dom';
import { FilterBar } from './FilterBar';
import { noFilters, type Filters } from './filterRecipes';

const authors = ['Mama', 'Oma', 'Papa'];
const show = (filters: Filters = noFilters, detailed = true) =>
  render(<FilterBar filters={filters} authors={authors} detailed={detailed} onFiltersChange={() => {}} />);

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

describe('recipe-filtering › Scrolling on a phone', () => {
  beforeEach(() => {
    show();
  });

  // Fixed to the bottom edge (above the keyboard offset) and clear of the safe area, in the base (phone) rules.
  test('the bar is fixed to the bottom edge', async () => {
    const css = flat(await cssFor(bar().className));
    assert.match(css, /position: fixed/);
    assert.match(css, /bottom: var\(--kb,0px\)/);
  });

  test('the bar is clear of the safe area', async () => {
    assert.match(flat(await cssFor(bar().className)), /padding-bottom: calc\(.*env\(safe-area-inset-bottom\)\)/);
  });

  // The search box is the last thing in the bar, so the bar's bottom edge is the box's edge.
  test('the search box is the last thing in the bar', () => {
    assert.ok(precedes(screen.getByTestId('FilterBar-authors'), searchBox()));
  });
});

// Requirement "Search bar fixed to the bottom": the search box and buttons are at least 48px high with text of at least 16px.
describe('FilterBar touch targets', () => {
  const targets = { 'search box': searchBox, 'Filter button': filterButton };

  for (const [name, find] of Object.entries(targets)) {
    describe(`the ${name}`, () => {
      beforeEach(() => {
        show();
      });

      test('is at least 48px high', async () => {
        assert.match(flat(await cssFor(find().className)), /min-height: calc\(var\(--spacing\) \* 12\)/);
      });

      test('has text of at least 16px', async () => {
        assert.match(flat(await cssFor(find().className)), /font-size: var\(--text-base\)/);
      });
    });
  }
});

describe('recipe-filtering › Search box stays put', () => {
  beforeEach(() => {
    show();
  });

  // The sheet comes before the search box inside the bar, and the bar is anchored at the bottom, so the sheet grows upward.
  test('the sheet is inside the bar and before the search box', () => {
    assert.ok(bar().contains(sheet()) && precedes(sheet(), searchBox()));
  });

  test('the bar is anchored at the bottom and never at the top', async () => {
    const css = flat(await cssFor(`${bar().className} ${sheet().className}`));
    assert.match(css, /bottom: var\(--kb,0px\)/);
    assert.doesNotMatch(css, /[^-]top: /);
  });

  // A 3px line in a faint ink colour separates them, below 48rem only.
  test('a 3px line separates the sheet from the search box below 48rem', async () => {
    const css = flat(await cssFor(`${bar().className} ${sheet().className}`));
    assert.match(css, /border-bottom-width: 3px/);
  });

  test('the line is a faint ink colour', async () => {
    const css = flat(await cssFor(`${bar().className} ${sheet().className}`));
    assert.match(css, /color-mix\(in oklab, var\(--color-ink\) 15%/);
  });

  test('the line is gone from 48rem', async () => {
    assert.doesNotMatch(wide(await cssFor(sheet().className)), /border-bottom-width/);
  });
});

describe('recipe-filtering › Reduced motion', () => {
  beforeEach(() => {
    show();
  });

  // The sheet rises in 0.22 s when open, and not at all when the person prefers reduced motion.
  test('the open sheet rises', async () => {
    assert.match(flat(await cssFor(sheet().className)), /animation: var\(--animate-rise\)/);
  });

  test('the sheet does not animate with reduced motion', async () => {
    assert.match(flat(await cssFor(sheet().className)), /@media \(prefers-reduced-motion: reduce\) \{[^@]*animation: none/);
  });
});

describe('recipe-filtering › Selected and unselected chips', () => {
  beforeEach(() => {
    show({ ...noFilters, author: 'Oma' });
  });

  test('only the chosen author chip is selected', () => {
    const selected = chips().filter(pressed);
    assert.deepEqual(
      selected.map((b) => b.textContent),
      ['Oma'],
    );
  });

  test('another chip is not pressed', () => {
    assert.equal(pressed(chip('Mama')), false);
  });

  // Unselected: dashed, no fill, no shadow. Selected: solid, dark fill, white text.
  test('an unselected chip is dashed, without fill or shadow', async () => {
    const css = flat(await cssFor(chip('Mama').className));
    assert.match(css, /border-style: dashed/);
    assert.match(css, /background-color: transparent/);
    assert.doesNotMatch(css, /box-shadow/);
  });

  test('a selected chip is solid with a dark fill and white text', async () => {
    const css = flat(await cssFor(chip('Oma').className));
    assert.match(css, /border-style: solid/);
    assert.match(css, /background-color: var\(--color-red\)/);
    assert.match(css, /color: var\(--color-white\)/);
  });
});

describe('recipe-filtering › Active filter count', () => {
  const count = (filters: Filters) => {
    show(filters);
    return screen.queryByTestId('FilterBar-count')?.textContent;
  };

  test('author and order are counted: 2', () => {
    assert.equal(count({ q: '', author: 'Oma', sort: 'az' }), '2');
  });

  test('author with the default order is counted: 1', () => {
    assert.equal(count({ q: '', author: 'Oma', sort: 'nieuwste' }), '1');
  });

  // Nothing active, or only a search text: no number.
  test('only a search text shows no number', () => {
    assert.equal(count({ ...noFilters, q: 'appel' }), undefined);
  });
});

describe('recipe-filtering › Wide screen', () => {
  beforeEach(() => {
    show();
  });

  // From 48rem the bar is in the flow with the search box above the chips, nothing is fixed, the sheet is always shown and the Filter button is gone.
  test('the bar is in the flow', async () => {
    assert.match(wide(await cssFor(bar().className)), /position: static/);
  });

  test('the search box is above the chips', async () => {
    assert.match(wide(await cssFor(bar().className)), /flex-direction: column-reverse/);
  });

  test('the sheet is always shown', async () => {
    assert.match(wide(await cssFor(sheet().className)), /display: block/);
  });

  test('the Filter button is gone', async () => {
    assert.match(wide(await cssFor(filterButton().className)), /display: none/);
  });
});

describe('FilterBar sheet', () => {
  beforeEach(() => {
    show();
  });

  test('exists and is controlled by the Filter button', () => {
    assert.ok(sheet());
  });

  test('starts collapsed', () => {
    assert.equal(filterButton().getAttribute('aria-expanded'), 'false');
  });

  test('starts hidden', () => {
    assert.equal(sheet().hasAttribute('data-open'), false);
  });
});

describe('FilterBar with few recipes', () => {
  beforeEach(() => {
    show(noFilters, false);
  });

  test('the search box is offered', () => {
    assert.ok(searchBox());
  });

  test('nothing else is offered', () => {
    for (const id of ['FilterBar-chip', 'FilterBar-sort', 'FilterBar-toggle', 'FilterBar-clear']) {
      assert.equal(screen.queryByTestId(id), null, id);
    }
  });
});

describe('FilterBar chosen order', () => {
  beforeEach(() => {
    show({ ...noFilters, sort: 'az' });
  });

  test('the chosen order is checked', () => {
    assert.equal(sortInput('az').checked, true);
    assert.equal(sortInput('nieuwste').checked, false);
  });

  test('the orders are labelled', () => {
    assert.equal(sortInput('az').labels?.[0]?.textContent, 'A–Z');
    assert.equal(sortInput('nieuwste').labels?.[0]?.textContent, 'Nieuwste');
  });

  test('Iedereen is chosen by default', () => {
    assert.equal(pressed(chip('Iedereen')), true);
  });
});

describe('button-press › Pressing a chip', () => {
  beforeEach(() => {
    show();
  });

  // Chips and the segments of the sort control have no hard shadow, so nothing in their classes moves or unshadows them on :active.
  const chipClasses = () => [chip('Iedereen').className, screen.getAllByTestId('FilterBar-sortLabel')[0].className].join(' ');

  test('chips and sort segments have no :active rule', async () => {
    assert.doesNotMatch(await cssFor(chipClasses()), /:active/);
  });

  test('chips and sort segments neither move nor have a shadow', async () => {
    assert.doesNotMatch(await cssFor(chipClasses()), /translate|box-shadow|shadow-hard/);
  });

  // The Filter button and "Wis filters", which do have a shadow, are the ones that press.
  test('the Filter button does press', async () => {
    assert.match(await cssFor(filterButton().className), /:active/);
  });
});

// That the search box does not move on screen is layout; 'Search box stays put' covers the classes that keep it still.
describe('recipe-filtering › Opening the sheet', () => {
  beforeEach(() => {
    show();
    fireEvent.click(filterButton());
  });

  test('the button shows it is expanded', () => {
    assert.equal(filterButton().getAttribute('aria-expanded'), 'true');
  });

  test('the sheet is open, above the search box', () => {
    assert.equal(sheet().hasAttribute('data-open'), true);
    assert.ok(precedes(sheet(), searchBox()));
  });

  test('the sheet holds the chips, the order and "Wis filters"', () => {
    assert.ok(chip('Iedereen', sheet()));
    assert.ok(sortInput('az', sheet()));
    assert.ok(within(sheet()).getByTestId('FilterBar-clear'));
  });
});

describe('recipe-filtering › Closing the sheet', () => {
  beforeEach(() => {
    show();
    fireEvent.click(filterButton());
  });

  describe('with the Filter button', () => {
    beforeEach(() => {
      fireEvent.click(filterButton());
    });

    test('the button shows it is collapsed', () => {
      assert.equal(filterButton().getAttribute('aria-expanded'), 'false');
    });

    test('the sheet is closed', () => {
      assert.equal(sheet().hasAttribute('data-open'), false);
    });
  });

  // Escape closes it too, from the search box, and focus goes back to the Filter button.
  describe('with Escape from the search box', () => {
    beforeEach(() => {
      searchBox().focus();
      fireEvent.keyDown(searchBox(), { key: 'Escape' });
    });

    test('the button shows it is collapsed', () => {
      assert.equal(filterButton().getAttribute('aria-expanded'), 'false');
    });

    test('the sheet is closed', () => {
      assert.equal(sheet().hasAttribute('data-open'), false);
    });

    test('focus goes back to the Filter button', () => {
      assert.equal(document.activeElement, filterButton());
    });
  });
});
