import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { fireEvent, render, screen } from '~testing/dom';
import { TabBar } from './TabBar';

const tabs = () => screen.getAllByTestId('TabBar-tab');

describe('TabBar', () => {
  test('is a tablist of two tabs', () => {
    render(<TabBar tab="ingredients" onTabSelect={() => {}} />);
    assert.equal(screen.getByTestId('TabBar-list').getAttribute('role'), 'tablist');
    assert.deepEqual(
      tabs().map((t) => t.getAttribute('role')),
      ['tab', 'tab'],
    );
  });

  test('marks only the given tab as selected', () => {
    render(<TabBar tab="steps" onTabSelect={() => {}} />);
    assert.deepEqual(
      tabs().map((t) => t.getAttribute('aria-selected')),
      ['false', 'true'],
    );
  });

  test('a click selects that tab', () => {
    const chosen: string[] = [];
    render(<TabBar tab="ingredients" onTabSelect={(t) => chosen.push(t)} />);
    fireEvent.click(tabs()[1]);
    assert.deepEqual(chosen, ['steps']);
  });
});
