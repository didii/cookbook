import { useContext } from 'react';
import type { Step } from '~/lib/steps';
import { cn } from '~/shared/cn';
import { StepChips } from './StepChips';
import { TimerCard } from './TimerCard';
import { TimersContext } from './timersContext';

type Props = { step: Step; number: number; done: boolean; onToggle: () => void; highlight?: number; peek?: boolean };

/** One step: label with its done square and the chips on one line, the text below as the tap target. */
export function StepItem({ step, number, done, onToggle, highlight, peek }: Props) {
  const timers = useContext(TimersContext);
  const cards = step.chips.timers.flatMap((_, i) => timers.view(`${number - 1}:${i}`) ?? []).filter((t) => t.state !== 'idle');

  return (
    <li
      id={`step-${number}`}
      className="relative isolate scroll-mt-[calc(var(--stack-h,0px)+0.75rem)] border-t-2 border-dashed border-ink/28 py-4 pb-4.5 first:border-t-0 first:pt-0"
    >
      {/* The highlight of a jump is remounted by each jump (new key), which restarts the fade; with reduced motion it stays at full tint until removed. */}
      {highlight !== undefined && (
        <span
          key={highlight}
          aria-hidden="true"
          className="pointer-events-none absolute -inset-x-2 inset-y-1 -z-10 animate-flash rounded-xl bg-yel/55 shadow-[0_0_0_0.5rem_color-mix(in_srgb,var(--color-yel)_55%,transparent)] motion-reduce:animate-none"
        />
      )}
      {peek && highlight === undefined && (
        <span aria-hidden="true" className="pointer-events-none absolute -inset-x-2 inset-y-1 -z-10 rounded-xl bg-yel/55" />
      )}
      <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <span
          className={cn('inline-flex items-center gap-1.5 text-[0.8125rem] font-black tracking-[0.08em] uppercase', done ? 'text-jade' : 'text-red')}
        >
          <span
            aria-hidden="true"
            className={cn(
              'grid size-3.5 shrink-0 place-items-center rounded-[0.25rem] border-2 text-[0.625rem] leading-none text-white',
              done ? 'border-jade bg-jade' : 'border-muted',
            )}
          >
            {done && '✓'}
          </span>
          Stap {number}
        </span>
        <StepChips chips={step.chips} step={number - 1} />
      </div>
      {cards.length > 0 && (
        <div className="mb-2 grid gap-2">
          {cards.map((t) => (
            <TimerCard key={t.id} view={t} />
          ))}
        </div>
      )}
      <button
        type="button"
        aria-pressed={done}
        onClick={onToggle}
        className={cn(
          '-mx-2.5 block w-[calc(100%+1.25rem)] cursor-pointer rounded-[0.625rem] border-0 bg-transparent px-2.5 py-1 text-left text-[clamp(1.25rem,5.4vw,1.5rem)] leading-[1.35] font-extrabold hover:bg-white/70',
          done && 'text-muted line-through',
        )}
      >
        {step.body}
      </button>
    </li>
  );
}
