import { useState, type ComponentProps } from 'react';
import { cn } from '~app/shared/cn';
import type { Step } from '~app/shared/recipe';
import { StepItem } from './StepItem';
import { toggled } from './toggled';

interface StepListProps extends ComponentProps<'ol'> {
  steps: Step[];
  highlight?: { step: number; n: number };
  peek?: number;
}

export function StepList({ steps, highlight, peek, className, ...props }: StepListProps) {
  // Only a visual aid while cooking: not stored.
  const [done, setDone] = useState<ReadonlySet<number>>(new Set());

  return (
    <ol {...props} className={cn('m-0 grid list-none p-0', className)}>
      {steps.map((s, i) => (
        <StepItem
          key={i}
          step={s}
          number={i + 1}
          done={done.has(i)}
          onToggle={() => setDone((prev) => toggled(prev, i))}
          highlight={highlight?.step === i ? highlight.n : undefined}
          peek={peek === i}
        />
      ))}
    </ol>
  );
}
