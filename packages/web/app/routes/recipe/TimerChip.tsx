import { useContext } from 'react';
import { formatMinutes } from '~/lib/steps';
import { formatCountdown } from '~/lib/timers';
import { cn } from '~/shared/cn';
import { Play } from '~/shared/icons';
import { press } from '~/shared/press';
import { TimersContext } from './timersContext';

type Props = { id: string; minutes: number; label?: string };

/**
 * The timer among a step's chips. Idle it is a button that starts the timer. While it runs it only shows the countdown, and only on a wide
 * screen: a narrow one shows the card below the label instead, and all controls are in the sidebar.
 */
export function TimerChip({ id, minutes, label }: Props) {
  const timers = useContext(TimersContext);
  const view = timers.view(id);

  if (!view || view.state === 'idle') {
    return (
      <li>
        <button
          type="button"
          onClick={() => timers.start(id)}
          aria-label={`Start timer van ${formatMinutes(minutes)}${label ? `, ${label}` : ''}`}
          className={cn(
            'group inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border-3 border-ink bg-jade pr-3 pl-2 text-[0.9375rem] font-black text-white hover:bg-[color-mix(in_srgb,var(--color-jade),white_14%)]',
            press,
          )}
        >
          <Play className="size-5 transition-transform group-hover:motion-safe:translate-x-px" />
          {formatMinutes(minutes)}
        </button>
      </li>
    );
  }
  if (view.state === 'native') return null;

  const finished = view.state === 'finished';
  return (
    <li className="max-[51.99rem]:hidden">
      <span
        role="timer"
        title={label}
        className={cn(
          'inline-flex min-h-10 items-center rounded-lg border-3 px-3 text-[0.9375rem] font-black tabular-nums',
          finished ? 'animate-ring border-ink bg-red text-white motion-reduce:animate-none' : 'border-jade bg-white text-jade',
        )}
      >
        {finished ? 'Klaar' : formatCountdown(view.remainingMs)}
      </span>
    </li>
  );
}
