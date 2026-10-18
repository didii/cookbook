import type { Step } from '~/lib/steps';
import { cn } from '~/shared/cn';
import { StepChips } from './StepChips';

type Props = { step: Step; number: number; done: boolean; onToggle: () => void };

/** One step: label with its done square and the chips on one line, the text below as the tap target. */
export function StepItem({ step, number, done, onToggle }: Props) {
  return (
    <li className="scroll-mt-20 border-t-2 border-dashed border-ink/28 py-4 pb-4.5 first:border-t-0 first:pt-0">
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
        <StepChips chips={step.chips} />
      </div>
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
