import { useContext, useEffect, useRef, type ComponentProps } from 'react';
import { cn } from '~app/shared/cn';
import { Stop } from '~app/shared/icons';
import { TimerButton } from './TimerButton';
import { formatCountdown, type TimerView } from './timers';
import { TimersContext } from './timersContext';

type Peek = (step: number | undefined) => void;
interface TimerSidebarProps extends ComponentProps<'section'> {
  timers: TimerView[];
  onJump: (step: number) => void;
  onPeek: Peek;
}

/** One timer with all its controls. Hovering it tints its step; the tint is also cleared when the card goes away under the mouse (stop, done). */
function SidebarCard({ timer: t, onJump, onPeek }: { timer: TimerView; onJump: (step: number) => void; onPeek: Peek }) {
  const controls = useContext(TimersContext);
  const finished = t.state === 'finished';
  const hovered = useRef(false);

  useEffect(
    () => () => {
      // An unmounted element gets no mouseleave.
      if (hovered.current) onPeek(undefined);
    },
    [onPeek],
  );

  return (
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- mouse-only hint; the same step is reachable by the jump button
    <li
      onMouseEnter={() => {
        hovered.current = true;
        onPeek(t.step);
      }}
      onMouseLeave={() => {
        hovered.current = false;
        onPeek(undefined);
      }}
      className={cn(
        'grid grid-cols-[auto_1fr_auto] items-center gap-x-2.5 gap-y-1 rounded-xl border-3 border-ink py-2 pr-2 pl-2.5 motion-reduce:animate-none',
        // The ring animates box-shadow, so a finished card has no hard shadow to swap with it.
        finished ? 'animate-ring bg-red text-white' : 'animate-pop bg-white shadow-hard-sm',
      )}
    >
      <span
        className={cn(
          'grid size-7 place-items-center rounded-full text-[0.9375rem] font-black',
          finished ? 'bg-white text-red' : 'bg-jade text-white',
        )}
      >
        <span className="sr-only">Stap </span>
        {t.step + 1}
      </span>
      <span className={cn('text-2xl leading-none font-black tabular-nums', !finished && 'text-jade')}>
        {finished ? 'Klaar' : formatCountdown(t.remainingMs)}
      </span>
      {t.label && <small className={cn('col-span-2 col-start-2 font-extrabold', finished ? 'text-white' : 'text-muted')}>{t.label}</small>}
      <span className="col-span-3 mt-1 flex gap-1.5 *:flex-1">
        <TimerButton data-testid="SidebarCard-add1" onClick={() => controls.add(t.id, 1)} aria-label="Eén minuut erbij">
          +1
        </TimerButton>
        <TimerButton data-testid="SidebarCard-add5" onClick={() => controls.add(t.id, 5)} aria-label="Vijf minuten erbij">
          +5
        </TimerButton>
        <TimerButton
          data-testid="SidebarCard-jump"
          onClick={() => onJump(t.step)}
          aria-label={`Ga naar stap ${t.step + 1}`}
          title={`Ga naar stap ${t.step + 1}`}
        >
          →
        </TimerButton>
        {finished ? (
          <TimerButton main onClick={() => controls.stop(t.id)}>
            Klaar
          </TimerButton>
        ) : (
          <TimerButton
            data-testid="SidebarCard-stop"
            onClick={() => controls.stop(t.id)}
            aria-label="Stop timer"
            className="hover:bg-red hover:text-white"
          >
            <Stop className="size-4" />
            Stop
          </TimerButton>
        )}
      </span>
    </li>
  );
}

/** Wide screens: every running or finished timer above the ingredients, with all its controls, whatever the scroll position. */
export function TimerSidebar({ timers, onJump, onPeek, className, ...props }: TimerSidebarProps) {
  if (timers.length === 0) return null;

  return (
    <section {...props} aria-label="Timers" className={cn('mb-6 grid shrink-0 gap-2 max-[51.99rem]:hidden', className)}>
      <h3 className="text-[0.8125rem] font-black tracking-[0.08em] text-muted uppercase">Timers</h3>
      <ul className="m-0 grid list-none gap-2 p-0">
        {timers.map((t) => (
          <SidebarCard key={t.id} timer={t} onJump={onJump} onPeek={onPeek} />
        ))}
      </ul>
    </section>
  );
}
