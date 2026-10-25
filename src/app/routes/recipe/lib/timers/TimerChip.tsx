import { useContext, type ComponentProps } from 'react';
import { cn } from '~app/shared/cn';
import { formatMinutes } from '~app/shared/formatter';
import { Play } from '~app/shared/icons';
import { press } from '~app/shared/press';
import { formatCountdown } from './timers';
import { TimersContext } from './timersContext';

interface TimerChipProps extends ComponentProps<'li'> {
  timerId: string;
  minutes: number;
  label?: string;
}

/**
 * The timer among a step's chips. Idle it is a button that starts the timer. While it runs it only shows the countdown, and only on a wide
 * screen: a narrow one shows the card below the label instead, and all controls are in the sidebar.
 */
export function TimerChip({ timerId, minutes, label, className, ...props }: TimerChipProps) {
  const timers = useContext(TimersContext);
  const view = timers.view(timerId);

  if (!view || view.state === 'idle') {
    return (
      <li {...props} className={className}>
        <button
          type="button"
          data-testid="TimerChip-start"
          onClick={() => timers.start(timerId)}
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
    <li {...props} className={cn('max-[51.99rem]:hidden', className)}>
      <span
        role="timer"
        data-testid="TimerChip-countdown"
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
