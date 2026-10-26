import assert from 'node:assert/strict';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, test } from 'vitest';
import { defaultRules } from '~app/shared/rules';
import { toRows, type RulesErrors, type RulesRows } from '~app/shared/rules.server';
import { act, fireEvent, openAutocomplete, render, screen, within } from '~testing/dom';
import { RulesForm } from './RulesForm';

const show = (initial: RulesRows = toRows(defaultRules), errors?: RulesErrors) =>
  render(<RouterProvider router={createMemoryRouter([{ path: '/', element: <RulesForm initial={initial} errors={errors} /> }])} />);

const posted = (): RulesRows => JSON.parse((screen.getByTestId('RulesForm-rules') as HTMLInputElement).value);
const lists = () => ['units', 'looseUnits', 'durations', 'degreeWords'].map((name) => screen.getByTestId(`RulesForm-${name}`));
const rowsOf = (list: HTMLElement) => within(list).getAllByTestId('RuleRow-field') as HTMLInputElement[];
const durationList = () => screen.getByTestId('RulesForm-durations');
const looseList = () => screen.getByTestId('RulesForm-looseUnits');
const unitsList = () => screen.getByTestId('RulesForm-units');
const degreesList = () => screen.getByTestId('RulesForm-degreeWords');
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
  test('the page has the lists of the categories Eenheden, Duur and Graden', () => {
    show();
    assert.equal(lists().length, 4);
    assert.deepEqual(
      screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent),
      ['Eenheden', 'Duur', 'Graden'],
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
