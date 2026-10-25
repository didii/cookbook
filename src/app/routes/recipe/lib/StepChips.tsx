import type { ComponentProps } from 'react';
import { cn } from '~app/shared/cn';
import { Thermometer } from '~app/shared/icons';
import type { Step } from '~app/shared/recipe';
import { TimerChip } from './timers/TimerChip';

interface StepChipsProps extends ComponentProps<'ul'> {
  step: Step;
  index: number;
  done?: boolean;
}

const chip = 'inline-flex items-center gap-1.5 rounded-md bg-ink/8 px-2 text-sm leading-6 font-bold text-muted';

/** The chips of one step: quiet static ones for ingredients and oven, an operable one for the timer. Renders nothing for a step without chips. */
export function StepChips({ step, index, done, className, ...props }: StepChipsProps) {
  if (!step.ingredients.length && step.ovenTemperature === undefined && !step.timer) return null;

  return (
    <ul {...props} className={cn('m-0 flex flex-auto list-none flex-wrap items-center gap-x-2 gap-y-1.5 p-0', className)}>
      {step.ingredients.map((x, i) => (
        <li key={i} className={cn(chip, done && 'opacity-60')}>
          <b data-testid="StepChips-quantity" className="font-black text-blu">
            {x.quantityText}
          </b>{' '}
          {x.name}
        </li>
      ))}
      {step.ovenTemperature !== undefined && (
        <li data-testid="StepChips-oven" className={cn(chip, done && 'opacity-60')}>
          <Thermometer className="size-4" />
          <b className="font-black text-red">{step.ovenTemperature} °C</b> oven
        </li>
      )}
      {step.timer && <TimerChip timerId={`${index}`} minutes={step.timer.minutes} label={step.timer.label} />}
    </ul>
  );
}
