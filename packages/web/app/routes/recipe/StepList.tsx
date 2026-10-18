import { useState } from 'react';
import type { Step } from '~/lib/steps';
import { toggled } from '~/lib/toggled';
import { StepItem } from './StepItem';

type Props = { steps: Step[] };

export function StepList({ steps }: Props) {
  // Only a visual aid while cooking: not stored.
  const [done, setDone] = useState<ReadonlySet<number>>(new Set());

  return (
    <ol className="m-0 grid list-none p-0">
      {steps.map((s, i) => (
        <StepItem key={i} step={s} number={i + 1} done={done.has(i)} onToggle={() => setDone((prev) => toggled(prev, i))} />
      ))}
    </ol>
  );
}
