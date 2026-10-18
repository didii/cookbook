import { formatCountdown, type TimerView } from '~/lib/timers';
import { cn } from '~/shared/cn';

type Props = { timers: TimerView[]; onJump: (step: number) => void };

/** Narrow screens: the timers whose step is out of view, in a row under the tab bar. Always mounted (hidden when empty) so the stack can measure it. */
export function TimerDock({ timers, onJump }: Props) {
  return (
    <nav
      hidden={timers.length === 0}
      aria-label="Lopende timers"
      className="absolute inset-x-0 top-full flex gap-2 overflow-x-auto border-b-3 border-ink bg-yel px-[max(1rem,4vw)] py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {timers.map((t) => {
        const finished = t.state === 'finished';
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onJump(t.step)}
            aria-label={`Stap ${t.step + 1}${t.label ? `, ${t.label}` : ''}, ${finished ? 'klaar' : `${formatCountdown(t.remainingMs)} over`}. Ga naar de stap`}
            className={cn(
              'inline-flex min-h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full border-3 border-ink py-1 pr-3 pl-1 font-black motion-reduce:animate-none',
              finished ? 'animate-ring bg-red text-white' : 'animate-pop bg-white',
            )}
          >
            <span
              className={cn('grid size-7 place-items-center rounded-full text-[0.9375rem]', finished ? 'bg-white text-red' : 'bg-jade text-white')}
            >
              {t.step + 1}
            </span>
            <span className="text-[1.0625rem] tabular-nums">{finished ? 'Klaar' : formatCountdown(t.remainingMs)}</span>
            {t.label && <small className={cn('text-sm font-extrabold max-[24rem]:hidden', finished ? 'text-white' : 'text-muted')}>{t.label}</small>}
          </button>
        );
      })}
    </nav>
  );
}
