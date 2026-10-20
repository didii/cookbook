import { useContext } from 'react';
import { formatCountdown, type TimerView } from '~/lib/timers';
import { cn } from '~/shared/cn';
import { Alarm, Stop } from '~/shared/icons';
import { TimerButton } from './TimerButton';
import { TimersContext } from './timersContext';

type Props = { view: TimerView };

/** A timer under its step's label: running or finished on a narrow screen, so the chips do not move; the note of a hand-over to the app on any screen. */
export function TimerCard({ view }: Props) {
  const timers = useContext(TimersContext);
  const finished = view.state === 'finished';

  if (view.state === 'native') {
    return (
      <output className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border-3 border-dashed border-ink py-2 pr-2 pl-3.5">
        <span className="grid">
          <span className="font-black tabular-nums">In je app · {formatCountdown(view.remainingMs)}</span>
          {view.label && <small className="font-extrabold text-muted">{view.label}</small>}
        </span>
        <span className="ml-auto flex gap-1.5">
          <TimerButton onClick={() => timers.undoHandOver(view.id)} aria-label="Laat de timer hier verder lopen (de timer in je app loopt door)">
            {timers.clock.auto ? 'Hier laten lopen' : 'Herstel'}
          </TimerButton>
          <TimerButton
            onClick={() => timers.stop(view.id)}
            aria-label="Wis deze notitie (de timer in je app loopt door)"
            className="hover:bg-red hover:text-white"
          >
            Wis
          </TimerButton>
        </span>
      </output>
    );
  }

  return (
    <div
      role={finished ? 'alert' : 'group'}
      aria-label={finished ? undefined : `Timer${view.label ? ` ${view.label}` : ''}`}
      className={cn(
        'flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border-3 border-ink py-2 pr-2 pl-3.5 min-[52rem]:hidden',
        // The ring animates box-shadow, so a finished card has no hard shadow to swap with it.
        finished ? 'animate-ring bg-red text-white motion-reduce:animate-none' : 'bg-white shadow-hard-sm',
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
        {!finished && timers.clock.available && (
          <TimerButton onClick={() => timers.handOver(view.id)} aria-label="Geef de resterende tijd aan je klok-app">
            <Alarm className="size-4" />
            App
          </TimerButton>
        )}
        {finished ? (
          <TimerButton main onClick={() => timers.stop(view.id)}>
            Klaar
          </TimerButton>
        ) : (
          <TimerButton onClick={() => timers.stop(view.id)} aria-label="Stop timer" className="hover:bg-red hover:text-white">
            <Stop className="size-4" />
            Stop
          </TimerButton>
        )}
      </span>
    </div>
  );
}
