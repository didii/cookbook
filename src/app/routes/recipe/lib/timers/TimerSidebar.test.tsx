import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { fireEvent, render, screen } from '~testing/dom';
import type { TimerView } from './timers';
import { TimerSidebar } from './TimerSidebar';

const timers: TimerView[] = [
  { id: '1', step: 1, minutes: 30, label: 'Deeg rust', state: 'running', remainingMs: 29 * 60_000 },
  { id: '9', step: 9, minutes: 50, label: 'Bakken', state: 'running', remainingMs: 49 * 60_000 },
];

describe('TimerSidebar', () => {
  const show = (onJump: (step: number) => void = () => {}) => render(<TimerSidebar timers={timers} onJump={onJump} onPeek={() => {}} />);

  test('lists a card per timer', () => {
    const { container } = show();
    assert.equal(container.querySelectorAll('li').length, 2);
  });

  test('has a jump button per timer that names the step', () => {
    show();
    const jump = screen.getAllByTestId('SidebarCard-jump');
    assert.equal(jump.length, 2);
    assert.ok(jump.every((b) => b.getAttribute('aria-label')!.startsWith('Ga naar stap')));
    assert.equal(jump[0].getAttribute('aria-label'), 'Ga naar stap 2');
  });

  test('has labelled add-a-minute buttons', () => {
    show();
    assert.equal(screen.getAllByTestId('SidebarCard-add1').length, 2);
    assert.ok(screen.getAllByTestId('SidebarCard-add1').every((b) => b.getAttribute('aria-label') === 'Eén minuut erbij'));
  });

  test('has labelled add-five-minutes buttons', () => {
    show();
    assert.equal(screen.getAllByTestId('SidebarCard-add5').length, 2);
    assert.ok(screen.getAllByTestId('SidebarCard-add5').every((b) => b.getAttribute('aria-label') === 'Vijf minuten erbij'));
  });

  test('has labelled stop buttons', () => {
    show();
    assert.equal(screen.getAllByTestId('SidebarCard-stop').length, 2);
    assert.ok(screen.getAllByTestId('SidebarCard-stop').every((b) => b.getAttribute('aria-label') === 'Stop timer'));
  });

  test('a jump button goes to the step of its timer', () => {
    const jumped: number[] = [];
    show((step) => jumped.push(step));
    fireEvent.click(screen.getAllByTestId('SidebarCard-jump')[0]);
    assert.deepEqual(jumped, [1]);
  });

  test('renders nothing without timers', () => {
    assert.equal(render(<TimerSidebar timers={[]} onJump={() => {}} onPeek={() => {}} />).container.firstChild, null);
  });
});
