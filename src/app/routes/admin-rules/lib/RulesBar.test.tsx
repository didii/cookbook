import assert from 'node:assert/strict';
import { afterEach, describe, test, vi } from 'vitest';
import { fireEvent, precedes, render, screen } from '~testing/dom';
import { RulesBar } from './RulesBar';

afterEach(() => vi.unstubAllGlobals());

describe('parsing-rules › Save bar', () => {
  // Needs a browser: the bar stays at the bottom of the screen while the page scrolls.
  test.todo('the bar is fixed to the bottom of the screen');

  test('"Standaardwaarden herstellen" comes before "Opslaan"', () => {
    render(<RulesBar />);
    assert.ok(precedes(screen.getByTestId('RulesBar-reset'), screen.getByTestId('RulesBar-save')));
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
