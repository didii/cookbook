import { useContext } from 'react';
import { formatCountdown, type TimerView } from '~/lib/timers';
import { cn } from '~/shared/cn';
import { TimerButton } from './TimerButton';
import { TimersContext } from './timersContext';

type Props = { view: TimerView };

/** A running or finished timer on a narrow screen: on its own line below the step's label, so the chips do not move. */
export function TimerCard({ view }: Props) {
  const timers = useContext(TimersContext);
  const finished = view.state === 'finished';

  return (
    <div
      role={finished ? 'alert' : 'group'}
      aria-label={finished ? undefined : `Timer${view.label ? ` ${view.label}` : ''}`}
      className={cn(
        'flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border-3 border-ink py-2 pr-2 pl-3.5 shadow-hard-sm min-[52rem]:hidden',
        finished ? 'animate-ring bg-red text-white motion-reduce:animate-none' : 'bg-white',
      )}
    >
      <span className={cn('leading-none font-black tracking-tight tabular-nums', finished ? 'text-2xl' : 'text-4xl text-jade')}>
        {finished ? `Stap ${view.step + 1} klaar` : formatCountdown(view.remainingMs)}
      </span>
      {view.label && <small className={cn('min-w-16 flex-1 font-extrabold', finished ? 'text-white' : 'text-muted')}>{view.label}</small>}
      <span className="ml-auto flex gap-1.5">
        <TimerButton onClick={() => timers.add(view.id, 1)} aria-label="Eén minuut erbij">
          +1
        </TimerButton>
        <TimerButton onClick={() => timers.add(view.id, 5)} aria-label="Vijf minuten erbij">
          +5
        </TimerButton>
        {finished ? (
          <TimerButton main onClick={() => timers.stop(view.id)}>
            Klaar
          </TimerButton>
        ) : (
          <TimerButton onClick={() => timers.stop(view.id)} aria-label="Stop timer">
            Stop
          </TimerButton>
        )}
      </span>
    </div>
  );
}
