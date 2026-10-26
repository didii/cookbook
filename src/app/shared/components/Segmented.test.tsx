import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { fireEvent, render, screen } from '~testing/dom';
import { Segmented } from './Segmented';

const options = [
  { value: 'a', label: 'Eerste' },
  { value: 'b', label: 'Tweede' },
];
const show = (value: string, onChange: (value: string) => void = () => {}) =>
  render(
    <Segmented
      legend="Volgorde"
      options={options}
      value={value}
      onChange={onChange}
      inputProps={{ 'data-testid': 'Test-input' }}
      labelProps={{ 'data-testid': 'Test-label' }}
    />,
  );

describe('Segmented', () => {
  test('the options are labelled', () => {
    show('a');
    assert.deepEqual(
      screen.getAllByTestId('Test-label').map((l) => l.textContent),
      ['Eerste', 'Tweede'],
    );
  });

  test('the legend is shown', () => {
    show('a');
    assert.equal(screen.getByRole('group').querySelector('legend')?.textContent, 'Volgorde');
  });

  test('the selected value is checked', () => {
    show('b');
    assert.deepEqual(
      screen.getAllByTestId<HTMLInputElement>('Test-input').map((i) => i.checked),
      [false, true],
    );
  });

  test('choosing an option reports its value', () => {
    const chosen: string[] = [];
    show('a', (v) => chosen.push(v));
    fireEvent.click(screen.getAllByTestId('Test-input')[1]!);
    assert.deepEqual(chosen, ['b']);
  });
});
