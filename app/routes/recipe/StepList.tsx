import { useState } from 'react';
import type { Step } from '~/lib/recipe';
import { toggled } from '~/lib/toggled';
import { StepItem } from './StepItem';

type Props = { steps: Step[]; highlight?: { step: number; n: number }; peek?: number };

export function StepList({ steps, highlight, peek }: Props) {
  // Only a visual aid while cooking: not stored.
  const [done, setDone] = useState<ReadonlySet<number>>(new Set());

  return (
    <ol className="m-0 grid list-none p-0">
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
