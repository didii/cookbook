import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { render, screen } from '~testing/dom';
import { Button } from './Button';
import { press } from '../press';

describe('Button', () => {
  test('carries every press class after class merging', () => {
    render(<Button data-testid="button" />);
    const button = screen.getByTestId('button').className;
    for (const c of press.split(' ')) assert.ok(button.includes(c), c);
  });

  test('aria-expanded changes no class', () => {
    const rest = render(<Button data-testid="button" />).getByTestId('button').className;
    render(<Button data-testid="button-expanded" aria-expanded />);
    assert.equal(screen.getByTestId('button-expanded').className, rest);
  });
});
