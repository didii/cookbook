import assert from 'node:assert/strict';
import { afterEach, describe, test, vi } from 'vitest';
import { cssFor, mediaFor } from '~testing/css';
import { fireEvent, precedes, render, screen } from '~testing/dom';
import { RulesBar } from './RulesBar';

afterEach(() => vi.unstubAllGlobals());

describe('parsing-rules › Save bar', () => {
  // Needs a browser: the bar stays at the bottom of the screen while the page scrolls.
  test.todo('the bar is fixed to the bottom of the screen');

  // The first submit button is the one Enter in a field uses.
  test('"Opslaan" is the first submit button, so Enter never restores', () => {
    render(<RulesBar />);
    assert.ok(precedes(screen.getByTestId('RulesBar-save'), screen.getByTestId('RulesBar-reset')));
  });

  test('"Opslaan" submits with the intent save', () => {
    render(<RulesBar />);
    const save = screen.getByTestId('RulesBar-save') as HTMLButtonElement;
    assert.deepEqual([save.type, save.name, save.value], ['submit', 'intent', 'save']);
  });

  test('"Standaardwaarden herstellen" submits with the intent reset', () => {
    render(<RulesBar />);
    const reset = screen.getByTestId('RulesBar-reset') as HTMLButtonElement;
    assert.deepEqual([reset.type, reset.name, reset.value], ['submit', 'intent', 'reset']);
  });
});

describe('parsing-rules › Restore is confirmed first', () => {
  test('declining stops the submit', () => {
    vi.stubGlobal('confirm', () => false);
    render(<RulesBar />);
    assert.equal(fireEvent.click(screen.getByTestId('RulesBar-reset')), false);
  });

  test('confirming lets the submit go on', () => {
    vi.stubGlobal('confirm', () => true);
    render(<RulesBar />);
    assert.equal(fireEvent.click(screen.getByTestId('RulesBar-reset')), true);
  });
});

describe('admin-nav › Bar beside the navigation', () => {
  // Needs a browser: the pixel position of the bar is real layout.
  test.todo('the save bar starts at the left edge of the content');

  test('from 64rem the content skips the navigation column', async () => {
    render(<RulesBar />);
    assert.match(await mediaFor(screen.getByTestId('RulesBar-content').className, '(width >= 64rem)'), /grid-column-start: 2/);
  });

  test('the bar is not placed in a column below 64rem', async () => {
    render(<RulesBar />);
    const css = (await cssFor(screen.getByTestId('RulesBar-content').className)).replace(/\s+/g, ' ');
    assert.doesNotMatch(css.replace(await mediaFor(screen.getByTestId('RulesBar-content').className, '(width >= 64rem)'), ''), /grid-column-start/);
  });
});
