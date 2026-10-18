import { useContext } from 'react';
import { TimersContext } from './timersContext';

/** "Hand every timer to the clock app": only offered where the clock app can be started, which is a phone. */
export function ClockSetting() {
  const { clock } = useContext(TimersContext);
  if (!clock.available) return null;

  return (
    <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-3 font-bold min-[52rem]:hidden">
      <input type="checkbox" checked={clock.auto} onChange={(e) => clock.setAuto(e.target.checked)} className="m-0 size-5 shrink-0 accent-jade" />
      Timers altijd in je app starten
    </label>
  );
}
