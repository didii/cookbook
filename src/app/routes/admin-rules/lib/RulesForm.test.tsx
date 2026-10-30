import assert from 'node:assert/strict';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, test } from 'vitest';
import { defaultRules } from '~app/shared/rules';
import { toRows, type RulesErrors, type RulesRows } from '~app/shared/rules.server';
import { defaultStaples } from '~app/shared/staples';
import { act, fireEvent, openAutocomplete, render, screen, within } from '~testing/dom';
import { RulesForm } from './RulesForm';

const show = (initial: RulesRows = toRows(defaultRules), errors?: RulesErrors) =>
  render(<RouterProvider router={createMemoryRouter([{ path: '/', element: <RulesForm initial={initial} errors={errors} /> }])} />);

const posted = (): RulesRows => JSON.parse((screen.getByTestId('RulesForm-rules') as HTMLInputElement).value);
const lists = () => ['units', 'looseUnits', 'durations', 'degreeWords', 'staples'].map((name) => screen.getByTestId(`RulesForm-${name}`));
const rowsOf = (list: HTMLElement) => within(list).getAllByTestId('RuleRow-field') as HTMLInputElement[];
const durationList = () => screen.getByTestId('RulesForm-durations');
const looseList = () => screen.getByTestId('RulesForm-looseUnits');
const unitsList = () => screen.getByTestId('RulesForm-units');
const degreesList = () => screen.getByTestId('RulesForm-degreeWords');
const staplesList = () => screen.getByTestId('RulesForm-staples');
const type = (el: HTMLElement, value: string) => fireEvent.change(el, { target: { value } });
const settle = () => act(async () => {});
const options = () => screen.queryAllByTestId('RuleRow-option').map((o) => o.textContent);

/** Adds a duration in the empty row of the durations. */
const addDuration = (word: string, minutes: string, fixed: boolean) => {
  const list = durationList();
  const free = rowsOf(list).length - 1;
  type(rowsOf(list)[free], word);
  const row = within(list).getAllByTestId('RuleRow-row')[free]!;
  type(within(row).getByTestId('DurationCells-minutes'), minutes);
  if (fixed) fireEvent.click(within(row).getByTestId('DurationCells-fixed'));
};

describe('RulesForm', () => {
  test('the page has the lists of the categories Eenheden, Duur, Graden and Basisproducten', () => {
    show();
    assert.equal(lists().length, 5);
    assert.deepEqual(
      screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent),
      ['Eenheden', 'Duur', 'Graden', 'Basisproducten'],
    );
  });

  test('a list has one row per word and an empty row', () => {
    show();
    assert.deepEqual(
      rowsOf(unitsList()).map((f) => f.value),
      [...defaultRules.units, ''],
    );
  });
});

const sections = () => screen.getAllByTestId('RulesForm-section') as HTMLDetailsElement[];
const toggle = (title: string) =>
  fireEvent.click(within(sections().find((s) => s.querySelector('h2')?.textContent === title)!).getByTestId('RulesForm-toggle'));
const sectionOf = (title: string) => sections().find((s) => s.querySelector('h2')?.textContent === title)!;

describe('parsing-rules › Sections start closed', () => {
  test('the four headings are shown', () => {
    show();
    assert.deepEqual(
      sections().map((s) => s.querySelector('h2')?.textContent),
      ['Eenheden', 'Duur', 'Graden', 'Basisproducten'],
    );
  });

  test('none of the sections is open', () => {
    show();
    assert.deepEqual(
      sections().map((s) => s.open),
      [false, false, false, false],
    );
  });
});

describe('parsing-rules › Open a section', () => {
  test('activating "Duur" opens only its section', () => {
    show();
    toggle('Duur');
    assert.deepEqual(
      sections().map((s) => s.open),
      [false, true, false, false],
    );
  });
});

describe('parsing-rules › Close a section', () => {
  test('activating the heading of an open section closes it', () => {
    show();
    toggle('Duur');
    toggle('Duur');
    assert.equal(sectionOf('Duur').open, false);
  });
});

describe('parsing-rules › Folding keeps the typed rows', () => {
  test('a unit typed before closing "Eenheden" is posted', () => {
    show();
    toggle('Eenheden');
    type(rowsOf(unitsList()).at(-1)!, 'kopje');
    toggle('Eenheden');
    assert.ok(posted().units.includes('kopje'));
  });

  test('the closed section keeps its fields in the form', () => {
    show();
    assert.ok(within(sectionOf('Eenheden')).getByTestId('RulesForm-units'));
  });
});

describe('parsing-rules › Refused save opens the section', () => {
  const errors = { degreeWords: { rows: { 0: 'staat ook bij duur' } } };

  test('"Graden" is open and the others are closed', () => {
    show(toRows(defaultRules), errors);
    assert.deepEqual(
      sections().map((s) => s.open),
      [false, false, true, false],
    );
  });

  test('the message is shown in it', () => {
    show(toRows(defaultRules), errors);
    assert.ok(within(sectionOf('Graden')).getByTestId('RuleRow-error'));
  });
});

describe('staple-management › The page has the staples', () => {
  test('the category Basisproducten is shown after Graden', () => {
    show();
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    assert.equal(headings.indexOf('Basisproducten'), headings.indexOf('Graden') + 1);
  });

  test('the staples are rows of one word, with an empty row', () => {
    show(toRows(defaultRules, ['zout', 'peper']));
    assert.deepEqual(
      rowsOf(staplesList()).map((f) => f.value),
      ['zout', 'peper', ''],
    );
  });
});

describe('staple-management › Adding a staple', () => {
  test('the staple is posted', () => {
    show();
    type(rowsOf(staplesList()).at(-1)!, 'meel');
    assert.ok(posted().staples.includes('meel'));
  });
});

describe('staple-management › Removing a staple', () => {
  test('the staple is no longer posted', () => {
    show();
    fireEvent.click(within(staplesList()).getAllByTestId('RuleRow-remove')[defaultStaples.indexOf('suiker')]!);
    assert.ok(!posted().staples.includes('suiker'));
  });
});

describe('staple-management › Saved with the other lists', () => {
  test('one form posts a unit and a staple together', () => {
    show();
    type(rowsOf(unitsList()).at(-1)!, 'kopje');
    type(rowsOf(staplesList()).at(-1)!, 'meel');
    assert.ok(posted().units.includes('kopje') && posted().staples.includes('meel'));
  });
});

describe('staple-management › Other characters', () => {
  test('the message of a refused save is on the faulty staple row', () => {
    show({ ...toRows(defaultRules), staples: ['zout!'] }, { staples: { rows: { 0: 'alleen letters' } } });
    assert.equal(within(within(staplesList()).getAllByTestId('RuleRow-row')[0]!).getByTestId('RuleRow-error').textContent, 'alleen letters');
  });
});

describe('staple-management › Too many staples', () => {
  test('the message about the list is shown with it', () => {
    show(toRows(defaultRules), { staples: { list: 'te veel' } });
    assert.equal(screen.getByTestId('RulesForm-error').textContent, 'te veel');
  });
});

describe('RulesForm duration rows', () => {
  test('a duration row has its word, its minutes and Vast', () => {
    show();
    const row = within(durationList()).getAllByTestId('RuleRow-row').at(-2)!;
    assert.equal((within(row).getByTestId('RuleRow-field') as HTMLInputElement).value, 'een uur');
    assert.equal((within(row).getByTestId('DurationCells-minutes') as HTMLInputElement).value, '60');
    assert.equal((within(row).getByTestId('DurationCells-fixed') as HTMLInputElement).checked, true);
  });
});

describe('parsing-rules › Spoken duration', () => {
  test('a row with Vast is posted as a fixed duration', () => {
    show();
    addDuration('drie kwartier', '45', true);
    assert.deepEqual(posted().durations.at(-1), { word: 'drie kwartier', minutes: 45, fixed: true });
  });
});

describe('parsing-rules › Duration per number', () => {
  test('a row without Vast is posted as a duration per number', () => {
    show();
    addDuration('halfuur', '30', false);
    assert.deepEqual(posted().durations.at(-1), { word: 'halfuur', minutes: 30, fixed: false });
  });

  test('the empty row at the end is not posted', () => {
    show();
    assert.equal(posted().durations.length, toRows(defaultRules).durations.length);
  });

  test('minutes left empty are posted as null', () => {
    show();
    type(rowsOf(durationList()).at(-1)!, 'een tijdje');
    assert.deepEqual(posted().durations.at(-1), { word: 'een tijdje', minutes: null, fixed: false });
  });
});

describe('RulesForm Enter in the minutes', () => {
  test('moves to the next row and does not submit', () => {
    show();
    const minutes = within(within(durationList()).getAllByTestId('RuleRow-row')[0]).getByTestId('DurationCells-minutes');
    assert.equal(fireEvent.keyDown(minutes, { key: 'Enter' }), false);
    assert.equal(document.activeElement, rowsOf(durationList())[1]);
  });
});

describe('parsing-rules › Add a unit', () => {
  test('a typed unit is posted', () => {
    show();
    type(rowsOf(unitsList()).at(-1)!, 'kopje');
    assert.ok(posted().units.includes('kopje'));
  });
});

describe('parsing-rules › Units are suggested', () => {
  test('the units that are not loose units are suggested for the loose units', async () => {
    show({ ...toRows(defaultRules), units: ['g', 'snuf', 'kopje'], looseUnits: ['snuf'] });
    rowsOf(looseList()).at(-1)!.focus();
    await screen.findAllByTestId('RuleRow-option');
    assert.deepEqual(options(), ['g', 'kopje']);
    await settle();
  });
});

describe('parsing-rules › Suggestions follow the units list', () => {
  test('a unit that is added without saving is suggested', async () => {
    show({ ...toRows(defaultRules), units: ['g'], looseUnits: [] });
    type(rowsOf(unitsList()).at(-1)!, 'druppel');
    openAutocomplete(rowsOf(looseList()).at(-1)!);
    await screen.findAllByTestId('RuleRow-option');
    assert.ok(options().includes('druppel'));
    await settle();
  });
});

describe('parsing-rules › Loose unit already filled in', () => {
  test('a loose unit is not suggested', async () => {
    show({ ...toRows(defaultRules), units: ['g', 'snuf'], looseUnits: ['snuf'] });
    openAutocomplete(rowsOf(looseList()).at(-1)!);
    await screen.findAllByTestId('RuleRow-option');
    assert.ok(!options().includes('snuf'));
    await settle();
  });
});

describe('parsing-rules › Another word is allowed', () => {
  test('a typed loose unit is posted', async () => {
    show();
    openAutocomplete(rowsOf(looseList()).at(-1)!);
    type(rowsOf(looseList()).at(-1)!, 'druppel');
    await settle();
    assert.ok(posted().looseUnits.includes('druppel'));
  });
});

describe('parsing-rules › Refused save keeps the rows', () => {
  const rows = { ...toRows(defaultRules), degreeWords: ['graden', 'u'] };
  const errors = { degreeWords: { rows: { 1: 'staat ook bij duur' } }, durations: { list: 'Er moet een duur zijn zonder "Vast".' } };

  test('the rows are shown as they were sent', () => {
    show(rows, errors);
    assert.deepEqual(
      rowsOf(degreesList()).map((f) => f.value),
      ['graden', 'u', ''],
    );
  });

  test('the message is on the faulty row', () => {
    show(rows, errors);
    const list = degreesList();
    const messages = within(list)
      .getAllByTestId('RuleRow-row')
      .map((row) => within(row).queryByTestId('RuleRow-error')?.textContent ?? null);
    assert.deepEqual(messages, [null, errors.degreeWords.rows[1], null]);
  });

  test('the message about a list is shown with it', () => {
    show(rows, errors);
    assert.equal(screen.getByTestId('RulesForm-error').textContent, errors.durations.list);
  });
});

describe('RulesForm messages', () => {
  const rows = { ...toRows(defaultRules), degreeWords: ['graden', 'u'] };
  const errors = { degreeWords: { rows: { 1: 'staat ook bij duur' } } };
  const messages = () =>
    within(degreesList())
      .getAllByTestId('RuleRow-row')
      .map((row) => within(row).queryByTestId('RuleRow-error')?.textContent ?? null);

  test('a message stays with its row when a row above it is removed', () => {
    show(rows, errors);
    fireEvent.click(within(degreesList()).getAllByTestId('RuleRow-remove')[0]);
    assert.deepEqual(messages(), [errors.degreeWords.rows[1], null]);
  });

  test('the empty rows have the placeholder of their list', () => {
    show();
    assert.ok(rowsOf(unitsList()).at(-1)!.placeholder);
  });
});
