import { useState, type ReactNode } from 'react';
import type { Step } from '~app/shared/recipe';
import { defaultRules } from '~app/shared/rules';
import { classifyStored, type StepChips as Chips, type Context, type StepDraft } from './chips';
import { StepChips } from './StepChips';

export const noRows: Context = { rows: [], rules: defaultRules };

/** A step as the editor holds it, with the chips its stored form gives it. */
export const stepOf = (stored: Step, context: Context = noRows): StepDraft => ({ id: 's1', ...classifyStored(stored, context) });

/** The chips of a step wired to state, as the editor wires them. */
export function ChipsHarness({
  initial,
  context = noRows,
  extra,
}: {
  initial: Chips & { id: string };
  context?: Context;
  extra?: (step: StepDraft) => ReactNode;
}) {
  const [step, setStep] = useState<StepDraft>(initial);
  return (
    <div>
      <StepChips step={step} context={context} number={1} onHot={() => {}} onChange={(change) => setStep((s) => change(s, context))} />
      {extra?.(step)}
    </div>
  );
}
