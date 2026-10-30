import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { cssFor } from '~testing/css';
import { render, screen } from '~testing/dom';
import { UnusedEntries } from './UnusedEntries';

describe('fridge-search › Unused entries are struck through', () => {
  test('each entry is listed under the heading', () => {
    render(<UnusedEntries entries={['ei']} />);
    assert.ok(screen.getByTestId('UnusedEntries-heading').textContent);
    assert.deepEqual(
      screen.getAllByTestId('UnusedEntries-entry').map((e) => e.textContent),
      ['ei'],
    );
  });

  test('the entry is struck through', async () => {
    render(<UnusedEntries entries={['ei']} />);
    assert.match(await cssFor(screen.getByTestId('UnusedEntries-entry').className), /text-decoration-line: line-through/);
  });
});

describe('fridge-search › Screen readers get the reason', () => {
  test('the entry is followed by a text that only screen readers get', async () => {
    render(<UnusedEntries entries={['ei']} />);
    const reason = screen.getByTestId('UnusedEntries-reason');
    assert.ok(reason.textContent?.includes('(niet in dit recept)'));
    assert.match(await cssFor(reason.className), /clip/);
  });

  test('the reason comes with the entry, not with the strike-through', () => {
    render(<UnusedEntries entries={['ei']} />);
    assert.ok(!screen.getByTestId('UnusedEntries-entry').contains(screen.getByTestId('UnusedEntries-reason')));
  });
});

describe('fridge-search › All entries used', () => {
  test('there is no heading and no list', () => {
    render(<UnusedEntries entries={[]} />);
    assert.equal(screen.queryByTestId('UnusedEntries-section'), null);
  });
});
