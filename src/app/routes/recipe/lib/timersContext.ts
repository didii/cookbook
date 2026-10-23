import { createContext } from 'react';
import type { TimerView } from './timers/timers';

/** What the steps, the dock and the sidebar need of the page's timers. */
export type TimerControls = {
  /** The running or finished timers, in the order of the recipe. */
  active: TimerView[];
  view: (id: string) => TimerView | undefined;
  start: (id: string) => void;
  add: (id: string, minutes: number) => void;
  stop: (id: string) => void;
  /** Start the clock app's timer with the time that is left and stop counting here. */
  handOver: (id: string) => void;
  /** Take the timer back from the app; it runs here as if it had never been handed over. */
  undoHandOver: (id: string) => void;
  /** `available` only on devices that can start the clock app; `auto` is the setting that hands over every timer at its start. */
  clock: { available: boolean; auto: boolean; setAuto: (on: boolean) => void };
};

/** Without a provider (a step rendered alone) every timer is idle, the clock app is not available and the controls do nothing. */
export const TimersContext = createContext<TimerControls>({
  active: [],
  view: () => undefined,
  start() {},
  add() {},
  stop() {},
  handOver() {},
  undoHandOver() {},
  clock: { available: false, auto: false, setAuto() {} },
});
