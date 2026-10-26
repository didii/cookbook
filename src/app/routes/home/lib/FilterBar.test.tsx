import assert from 'node:assert/strict';
import { beforeEach, describe, test } from 'vitest';
import { cssFor } from '~testing/css';
import { act, fireEvent, openAutocomplete, precedes, render, screen, within } from '~testing/dom';
import { FilterBar } from './FilterBar';
import { noFilters, type Filters } from './filterRecipes';

const authors = ['Mama', 'Oma', 'Papa'];
const tags = ['Dessert', 'Soep'];
const show = (filters: Filters = noFilters, detailed = true, stored = tags) =>
  render(<FilterBar filters={filters} authors={authors} tags={stored} detailed={detailed} onFiltersChange={() => {}} />);

const bar = () => screen.getByTestId('FilterBar-bar');
const searchBox = () => screen.getByTestId('FilterBar-search');
const filterButton = () => screen.getByTestId('FilterBar-toggle');
const authorField = (root: HTMLElement = document.body) => within(within(root).getByTestId('FilterBar-authors')).getByTestId('MultiSelect-field');
const tagField = () => within(screen.getByTestId('FilterBar-tags')).getByTestId('MultiSelect-field');
const pickedAuthors = () =>
  within(screen.getByTestId('FilterBar-authors'))
    .queryAllByTestId('MultiSelect-value')
    .map((v) => v.textContent);
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

describe('recipe-filtering › No author picked', () => {
  test('the field says Iedereen', () => {
    show();
    assert.equal(authorField().getAttribute('placeholder'), 'Iedereen');
  });

  test('no author is shown as picked', () => {
    show();
    assert.deepEqual(pickedAuthors(), []);
  });

  test('picked authors are shown as chips', () => {
    show({ ...noFilters, authors: ['Oma', 'Papa'] });
    assert.deepEqual(pickedAuthors(), ['Oma', 'Papa']);
  });
});

describe('recipe-filtering › Active filter count', () => {
  const count = (filters: Filters) => {
    show(filters);
    return screen.queryByTestId('FilterBar-count')?.textContent;
  };

  test('two authors and order are counted: 2', () => {
    assert.equal(count({ q: '', authors: ['Oma', 'Papa'], sort: 'az' }), '2');
  });

  test('two authors, one tag and order are counted: 3', () => {
    assert.equal(count({ q: '', authors: ['Oma', 'Papa'], tags: ['Soep'], sort: 'az' }), '3');
  });

  test('author with the default order is counted: 1', () => {
    assert.equal(count({ q: '', authors: ['Oma'], sort: 'nieuwste' }), '1');
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

  test('both fields are in the sheet, which is always shown', () => {
    assert.ok(authorField(sheet()));
    assert.ok(within(sheet()).getByTestId('FilterBar-tags'));
  });

  // From 48rem the bar is in the flow with the search box above the filters, nothing is fixed, the sheet is always shown and the Filter button is gone.
  test('the bar is in the flow', async () => {
    assert.match(wide(await cssFor(bar().className)), /position: static/);
  });

  test('the search box is above the filters', async () => {
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
    for (const id of ['MultiSelect-field', 'FilterBar-sort', 'FilterBar-toggle', 'FilterBar-clear']) {
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
});

describe('button-press › Pressing a chip', () => {
  beforeEach(() => {
    show();
  });

  // The segments of the sort control have no hard shadow, so nothing in their classes moves or unshadows them on :active.
  const chipClasses = () => screen.getAllByTestId('FilterBar-sortLabel')[0].className;

  test('sort segments have no :active rule', async () => {
    assert.doesNotMatch(await cssFor(chipClasses()), /:active/);
  });

  test('sort segments neither move nor have a shadow', async () => {
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

  test('the sheet holds the author field, the order and "Wis filters"', () => {
    assert.ok(authorField(sheet()));
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

describe('FilterBar tag field', () => {
  const changesFor = (filters: Filters) => {
    const changes: Filters[] = [];
    render(<FilterBar filters={filters} authors={authors} tags={tags} detailed onFiltersChange={(f) => changes.push(f)} />);
    return changes;
  };

  test('offers the tags it was given', async () => {
    show();
    openAutocomplete(tagField());
    await screen.findAllByTestId('MultiSelect-option');
    assert.deepEqual(
      screen.getAllByTestId('MultiSelect-option').map((o) => o.textContent),
      tags,
    );
    await act(async () => {});
  });

  test('shows the picked tags as chips', () => {
    show({ ...noFilters, tags: ['Soep'] });
    assert.deepEqual(
      within(screen.getByTestId('FilterBar-tags'))
        .getAllByTestId('MultiSelect-value')
        .map((v) => v.textContent),
      ['Soep'],
    );
  });

  test('keeps a picked tag that no recipe has any more, so it can be removed', () => {
    show({ ...noFilters, tags: ['Soep'] }, true, []);
    assert.ok(within(screen.getByTestId('FilterBar-tags')).getByTestId('MultiSelect-remove'));
  });

  test('reports a picked tag together with the other filters', async () => {
    const changes = changesFor({ ...noFilters, sort: 'az' });
    openAutocomplete(tagField());
    fireEvent.click((await screen.findAllByTestId('MultiSelect-option')).find((o) => o.textContent === 'Soep')!);
    await act(async () => {});
    assert.deepEqual(changes.at(-1), { ...noFilters, sort: 'az', tags: ['Soep'] });
  });
});

describe('recipe-filtering › Removing a picked tag', () => {
  test('pressing the remove button reports the tag gone', async () => {
    const changes: Filters[] = [];
    render(
      <FilterBar
        filters={{ ...noFilters, tags: ['Soep', 'Dessert'] }}
        authors={authors}
        tags={tags}
        detailed
        onFiltersChange={(f) => changes.push(f)}
      />,
    );
    fireEvent.click(within(screen.getByTestId('FilterBar-tags')).getAllByTestId('MultiSelect-remove')[0]);
    await act(async () => {});
    assert.deepEqual(changes.at(-1)?.tags, ['Dessert']);
  });
});

describe('recipe-filtering › No tags stored', () => {
  test('the Tags field is not shown', () => {
    show(noFilters, true, []);
    assert.equal(screen.queryByTestId('FilterBar-tags'), null);
  });
});

describe('FilterBar search box', () => {
  test('says tags can be searched', () => {
    show();
    assert.ok(searchBox().getAttribute('placeholder')?.includes('tag'));
  });
});

// The field claims the Escape that closes its popup by preventing its default (see MultiSelect.test.tsx); the sheet then stays open.
describe('recipe-filtering › Escape closes the suggestions first', () => {
  const claimed = (e: Event) => e.preventDefault();

  beforeEach(() => {
    show();
    fireEvent.click(filterButton());
  });

  test('an Escape the field handled keeps the sheet open', () => {
    const field = authorField();
    field.addEventListener('keydown', claimed);
    fireEvent.keyDown(field, { key: 'Escape' });
    field.removeEventListener('keydown', claimed);
    assert.equal(sheet().hasAttribute('data-open'), true);
  });

  test('a plain Escape closes the sheet', () => {
    fireEvent.keyDown(authorField(), { key: 'Escape' });
    assert.equal(sheet().hasAttribute('data-open'), false);
  });
});

describe('FilterBar author field', () => {
  const field = () => within(screen.getByTestId('FilterBar-authors'));

  test('offers the authors it was given', async () => {
    show();
    openAutocomplete(authorField());
    await screen.findAllByTestId('MultiSelect-option');
    assert.deepEqual(
      screen.getAllByTestId('MultiSelect-option').map((o) => o.textContent),
      authors,
    );
    await act(async () => {});
  });

  test('reports the authors left after removing one', async () => {
    const changes: Filters[] = [];
    render(
      <FilterBar
        filters={{ ...noFilters, authors: ['Oma', 'Papa'] }}
        authors={authors}
        tags={tags}
        detailed
        onFiltersChange={(f) => changes.push(f)}
      />,
    );
    fireEvent.click(field().getAllByTestId('MultiSelect-remove')[0]);
    await act(async () => {});
    assert.deepEqual(changes.at(-1)?.authors, ['Papa']);
  });

  test('reports a picked author together with the other filters', async () => {
    const changes: Filters[] = [];
    render(<FilterBar filters={{ ...noFilters, sort: 'az' }} authors={authors} tags={tags} detailed onFiltersChange={(f) => changes.push(f)} />);
    openAutocomplete(authorField());
    fireEvent.click((await screen.findAllByTestId('MultiSelect-option')).find((o) => o.textContent === 'Oma')!);
    await act(async () => {});
    assert.deepEqual(changes.at(-1), { ...noFilters, sort: 'az', authors: ['Oma'] });
  });
});

// Whether the suggestions sit above the phone keyboard needs a real viewport and keyboard.
test.todo('FilterBar suggestions stay visible above the phone keyboard');

// The author chips are gone; the main spec still lists this scenario until the change is archived. Delete this todo then.
test.todo('recipe-filtering › Selected and unselected chips');
