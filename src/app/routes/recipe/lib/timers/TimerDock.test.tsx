import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import type { Step } from '~app/shared/recipe';
import { fireEvent, precedes, render, screen } from '~testing/dom';
import { TimerDock } from './TimerDock';
import { activeTimers, start, timerDefs } from './timers';
import { TimerSidebar } from './TimerSidebar';

const steps: Step[] = Array.from({ length: 10 }, (_, i) => ({
  body: `stap ${i + 1}`,
  ingredients: [],
  timer: i === 1 ? { minutes: 30, label: 'Deeg rust' } : i === 9 ? { minutes: 50, label: 'Bakken' } : undefined,
}));
const defs = timerDefs(steps);
const T0 = 1_000_000;
const timers = activeTimers(defs, start(start({}, defs[1], T0), defs[0], T0), T0 + 60_000);

describe('TimerDock', () => {
  test('holds a pill per timer', () => {
    render(<TimerDock timers={timers} onJump={() => {}} />);
    assert.equal(screen.getAllByTestId('TimerDock-pill').length, 2);
  });

  test('describes each pill with step, label and time left', () => {
    render(<TimerDock timers={timers} onJump={() => {}} />);
    const [second, tenth] = screen.getAllByTestId('TimerDock-pill');
    assert.match(second.getAttribute('aria-label')!, /^Stap 2, Deeg rust, 29:00/);
    assert.match(tenth.getAttribute('aria-label')!, /^Stap 10, Bakken, 49:00/);
  });

  test('puts earlier steps first', () => {
    render(<TimerDock timers={timers} onJump={() => {}} />);
    const [second, tenth] = screen.getAllByTestId('TimerDock-pill');
    assert.ok(precedes(second, tenth));
  });

  test('is shown when it holds timers', () => {
    render(<TimerDock timers={timers} onJump={() => {}} />);
    assert.equal(screen.getByTestId('TimerDock-dock').hidden, false);
  });

  test('a pill goes to the step of its timer', () => {
    const jumped: number[] = [];
    render(<TimerDock timers={timers} onJump={(step) => jumped.push(step)} />);
    fireEvent.click(screen.getAllByTestId('TimerDock-pill')[1]);
    assert.deepEqual(jumped, [9]);
  });

  test('is hidden when empty', () => {
    render(<TimerDock timers={[]} onJump={() => {}} />);
    assert.equal(screen.getByTestId('TimerDock-dock').hidden, true);
  });
});

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

// Need a browser: they depend on which steps are on screen, which IntersectionObserver reports from real layout; a DOM without layout reports nothing.
test.todo('step-timers › Timer docks when its step leaves the screen');
test.todo('step-timers › Timer undocks when its step returns');
test.todo('step-timers › Docked timers on the other tab');
test.todo('step-timers › Timers in the sidebar on a wide screen');
// Needs a browser: the animation must not replay when siblings change.
test.todo('step-timers › Only a new timer animates');
// Need a browser: scrolling to the step and the highlight fade.
test.todo('step-timers › Go to the step of a timer');
test.todo('recipe-viewing › Step is highlighted');
