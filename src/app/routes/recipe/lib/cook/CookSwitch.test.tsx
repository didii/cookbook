import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { fireEvent, render, screen } from '~testing/dom';
import { switchText } from './cookMode';
import { CookSwitch } from './CookSwitch';

describe('CookSwitch', () => {
  test('has the switch role', () => {
    render(<CookSwitch wanted={false} lock="off" manual={undefined} onToggle={() => {}} />);
    assert.equal(screen.getByTestId('CookSwitch-switch').getAttribute('role'), 'switch');
  });

  test('is checked when cook mode is wanted', () => {
    render(<CookSwitch wanted lock="on" manual={undefined} onToggle={() => {}} />);
    assert.equal(screen.getByTestId('CookSwitch-switch').getAttribute('aria-checked'), 'true');
  });

  test('is not checked when cook mode is not wanted', () => {
    render(<CookSwitch wanted={false} lock="off" manual={undefined} onToggle={() => {}} />);
    assert.equal(screen.getByTestId('CookSwitch-switch').getAttribute('aria-checked'), 'false');
  });

  test('shows the texts from switchText', () => {
    render(<CookSwitch wanted lock="on" manual onToggle={() => {}} />);
    const { title, sub } = switchText(true, 'on', true);
    assert.ok(screen.getByTestId('CookSwitch-text').textContent?.startsWith(title));
    assert.equal(screen.getByTestId('CookSwitch-sub').textContent, sub);
  });

  test('toggling calls onToggle', () => {
    let toggled = 0;
    render(<CookSwitch wanted={false} lock="off" manual={undefined} onToggle={() => toggled++} />);
    // Base UI's switch changes through the hidden checkbox beside it.
    fireEvent.click(screen.getByTestId('CookSwitch-label').querySelector('input')!);
    assert.equal(toggled, 1);
  });
});
