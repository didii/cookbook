import { createContext } from 'react';
import type { TimerView } from '~/lib/timers';

/** What the steps, the dock and the sidebar need of the page's timers. */
export type TimerControls = {
  /** The running or finished timers, in the order of the recipe. */
  active: TimerView[];
  view: (id: string) => TimerView | undefined;
  start: (id: string) => void;
  add: (id: string, minutes: number) => void;
  stop: (id: string) => void;
};

/** Without a provider (a step rendered alone) every timer is idle and the controls do nothing. */
export const TimersContext = createContext<TimerControls>({ active: [], view: () => undefined, start() {}, add() {}, stop() {} });
