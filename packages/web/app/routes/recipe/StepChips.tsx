import type { Step } from '~/lib/recipe';
import { cn } from '~/shared/cn';
import { Thermometer } from '~/shared/icons';
import { TimerChip } from './TimerChip';

type Props = { step: Step; index: number; done?: boolean };

const chip = 'inline-flex items-center gap-1.5 rounded-md bg-ink/8 px-2 text-sm leading-6 font-bold text-muted';

/** The chips of one step: quiet static ones for ingredients and oven, an operable one for the timer. Renders nothing for a step without chips. */
export function StepChips({ step, index, done }: Props) {
  if (!step.ingredients.length && step.ovenTemperature === undefined && !step.timer) return null;

  return (
    <ul className="m-0 flex flex-auto list-none flex-wrap items-center gap-x-2 gap-y-1.5 p-0">
      {step.ingredients.map((x, i) => (
        <li key={i} className={cn(chip, done && 'opacity-60')}>
          <b className="font-black text-blu">{x.quantity_text}</b> {x.name}
        </li>
      ))}
      {step.ovenTemperature !== undefined && (
        <li className={cn(chip, done && 'opacity-60')}>
          <Thermometer />
          <b className="font-black text-red">{step.ovenTemperature} °C</b> oven
        </li>
      )}
      {step.timer && <TimerChip id={`${index}`} minutes={step.timer.minutes} label={step.timer.label} />}
    </ul>
  );
}
