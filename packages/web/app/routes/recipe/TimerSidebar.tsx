import { useContext } from 'react';
import { formatCountdown, type TimerView } from '~/lib/timers';
import { cn } from '~/shared/cn';
import { TimerButton } from './TimerButton';
import { TimersContext } from './timersContext';

type Props = { timers: TimerView[]; onJump: (step: number) => void; onPeek: (step: number | undefined) => void };

/** Wide screens: every running or finished timer above the ingredients, with all its controls, whatever the scroll position. */
export function TimerSidebar({ timers, onJump, onPeek }: Props) {
  const controls = useContext(TimersContext);
  if (timers.length === 0) return null;

  return (
    <section aria-label="Timers" className="mb-6 grid shrink-0 gap-2 max-[51.99rem]:hidden">
      <h3 className="text-[0.8125rem] font-black tracking-[0.08em] text-muted uppercase">Timers</h3>
      <ul className="m-0 grid list-none gap-2 p-0">
        {timers.map((t) => {
          const finished = t.state === 'finished';
          return (
            // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- mouse-only hint; the same step is reachable by the jump button
            <li
              key={t.id}
              onMouseEnter={() => onPeek(t.step)}
              onMouseLeave={() => onPeek(undefined)}
              className={cn(
                'grid grid-cols-[auto_1fr_auto] items-center gap-x-2.5 gap-y-1 rounded-xl border-3 border-ink py-2 pr-2 pl-2.5 shadow-hard-sm motion-reduce:animate-none',
                finished ? 'animate-ring bg-red text-white' : 'animate-pop bg-white',
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
                <TimerButton onClick={() => controls.add(t.id, 1)} aria-label="Eén minuut erbij">
                  +1
                </TimerButton>
                <TimerButton onClick={() => controls.add(t.id, 5)} aria-label="Vijf minuten erbij">
                  +5
                </TimerButton>
                <TimerButton onClick={() => onJump(t.step)} aria-label={`Ga naar stap ${t.step + 1}`} title={`Ga naar stap ${t.step + 1}`}>
                  →
                </TimerButton>
                {finished ? (
                  <TimerButton main onClick={() => controls.stop(t.id)}>
                    Klaar
                  </TimerButton>
                ) : (
                  <TimerButton onClick={() => controls.stop(t.id)} aria-label="Stop timer" className="hover:bg-red hover:text-white">
                    Stop
                  </TimerButton>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
