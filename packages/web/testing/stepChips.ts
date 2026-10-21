import { createElement, useState } from 'react';
import { classifyStored, type StepChips as Chips, type Context } from '~/lib/chips';
import type { StepDraft } from '~/lib/draft';
import type { Step } from '~/lib/recipe';
import { StepChips } from '~/shared/recipeEditor/StepChips';

export const noRows: Context = { rows: [] };

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
  extra?: (step: StepDraft) => unknown;
}) {
  const [step, setStep] = useState<StepDraft>(initial);
  return createElement(
    'div',
    null,
    createElement(StepChips, { step, context, number: 1, onHot() {}, onChange: (change) => setStep((s) => change(s, context)) }),
    extra?.(step) as never,
  );
}
