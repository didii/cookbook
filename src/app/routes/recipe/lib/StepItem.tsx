import { useContext } from 'react';
import { cn } from '~app/shared/cn';
import type { Step } from '~app/shared/recipe';
import { StepChips } from './StepChips';
import { TimerCard } from './timers/TimerCard';
import { TimersContext } from './timers/timersContext';

const tint = 'pointer-events-none absolute inset-y-0 -inset-x-2 -z-10 rounded-xl bg-yel/55';

type Props = { step: Step; number: number; done: boolean; onToggle: () => void; highlight?: number; peek?: boolean };

/** One step: label with its done square and the chips on one line, the text below as the tap target. */
export function StepItem({ step, number, done, onToggle, highlight, peek }: Props) {
  const timers = useContext(TimersContext);
  const timer = step.timer && timers.view(`${number - 1}`);
  const cards = timer && timer.state !== 'idle' ? [timer] : [];

  return (
    <li
      id={`step-${number}`}
      className="relative isolate scroll-mt-[calc(var(--stack-h,0px)+0.75rem)] border-t-2 border-dashed border-ink/28 py-4 pb-4.5 first:border-t-0 first:pt-0"
    >
      {/* Tint between the dashed rules. A jump's highlight is remounted by each jump (new key), which restarts the fade; with reduced motion it
          stays at full tint until removed. Hovering the step's card in the sidebar shows the same tint without the fade and wins over it: the flash keeps running
          underneath, hidden with !important (which beats an animation), so it carries on where it was when the hover ends. */}
      {highlight !== undefined && (
        <span key={highlight} aria-hidden="true" className={cn(tint, 'animate-flash motion-reduce:animate-none', peek && 'opacity-0!')} />
      )}
      {peek && <span aria-hidden="true" className={tint} />}
      <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <span
          data-testid="StepItem-label"
          className={cn('inline-flex items-center gap-1.5 text-[0.8125rem] font-black tracking-[0.08em] uppercase', done ? 'text-jade' : 'text-red')}
        >
          <span
            aria-hidden="true"
            data-testid="StepItem-mark"
            className={cn(
              'grid size-3.5 shrink-0 place-items-center rounded-sm border-2 text-[0.625rem] leading-none text-white',
              done ? 'border-jade bg-jade' : 'border-muted',
            )}
          >
            {done && '✓'}
          </span>
          Stap {number}
        </span>
        <StepChips step={step} index={number - 1} done={done} />
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
        data-testid="StepItem-body"
        onClick={onToggle}
        className={cn(
          '-mx-2.5 block w-[calc(100%+1.25rem)] cursor-pointer rounded-[0.625rem] border-0 bg-transparent px-2.5 py-1 text-left text-[clamp(1.25rem,5.4vw,1.5rem)] leading-[1.35] font-extrabold hover:bg-white/70',
          done && 'opacity-45',
        )}
      >
        {step.body}
      </button>
    </li>
  );
}
