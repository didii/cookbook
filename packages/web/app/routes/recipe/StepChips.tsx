import type { StepChips as Chips } from '~/lib/steps';
import { TimerChip } from './TimerChip';

type Props = { chips: Chips; step: number };

const chip = 'inline-flex items-center gap-1.5 rounded-md bg-ink/8 px-2 text-sm leading-6 font-bold text-muted';

const Thermometer = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5 shrink-0">
    <path d="M6 9.2V3a2 2 0 1 1 4 0v6.2a3.5 3.5 0 1 1-4 0z" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="8" cy="11.5" r="1.6" fill="currentColor" />
  </svg>
);

/** The chips of one step: quiet static ones for ingredients and oven, an operable one per timer. Renders nothing for a step without chips. */
export function StepChips({ chips, step }: Props) {
  if (!chips.ingredients.length && !chips.oven.length && !chips.timers.length) return null;

  return (
    <ul className="m-0 flex flex-1 list-none flex-wrap items-center gap-x-2 gap-y-1.5 p-0">
      {chips.ingredients.map((x, i) => (
        <li key={`i${i}`} className={chip}>
          <b className="font-black text-blu">{x.quantity}</b> {x.name}
        </li>
      ))}
      {chips.oven.map((x, i) => (
        <li key={`o${i}`} className={chip}>
          <Thermometer />
          <b className="font-black text-red">{x.degrees} °C</b> oven
        </li>
      ))}
      {chips.timers.map((x, i) => (
        <TimerChip key={`t${i}`} id={`${step}:${i}`} minutes={x.minutes} label={x.label} />
      ))}
    </ul>
  );
}
