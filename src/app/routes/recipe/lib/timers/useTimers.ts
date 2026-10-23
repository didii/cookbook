import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { Step } from '~app/shared/recipe';
import { soundAlarm } from './alarm';
import { clockAvailable, clockIntentUrl, readClockSetting, writeClockSetting } from './clock';
import {
  activeTimers,
  add,
  finishTitle,
  handOver,
  newlyFinished,
  restore,
  serialize,
  startTimer,
  stop,
  timerDefs,
  timerView,
  undoHandOver,
  type Timers,
} from './timers';
import type { TimerControls } from './timersContext';

const subscribeNever = () => () => {};

/** The state until sessionStorage has been read, told apart from a restored (even empty) state by identity. */
const notRestored: Timers = {};

const read = (key: string) => {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
};

/** The page's timers: state from absolute end times, kept in sessionStorage (read after hydration), one interval while any runs. */
export function useTimers(slug: string, steps: Step[]): TimerControls {
  const defs = useMemo(() => timerDefs(steps), [steps]);
  const key = `timers:${slug}`;
  const [timers, setTimers] = useState<Timers>(notRestored);
  const [now, setNow] = useState(0);
  const audio = useRef<AudioContext>(undefined);
  const seen = useRef(new Set<string>());
  const title = useRef<string>(undefined);

  useEffect(() => {
    const restored = restore(read(key), defs);
    const at = Date.now();
    // A timer that ended while the page was away is shown as finished but does not beep.
    seen.current = new Set(defs.filter((d) => timerView(restored, d, at).state === 'finished').map((d) => d.id));
    // oxlint-disable-next-line react/set-state-in-effect -- sessionStorage may only be read after hydration
    setTimers(restored);
    setNow(at);
  }, [key, defs]);

  useEffect(() => {
    // Before the restore the state is the placeholder; writing it would wipe what was stored.
    if (timers === notRestored) return;
    try {
      sessionStorage.setItem(key, serialize(timers));
    } catch {
      // Private mode or full: timers just do not survive a reload.
    }
  }, [key, timers]);

  const running = defs.some((d) => timerView(timers, d, now).state === 'running');
  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, [running]);

  const finished = activeTimers(defs, timers, now).filter((t) => t.state === 'finished');
  useEffect(() => {
    const ended = newlyFinished(defs, timers, seen.current, now);
    for (const id of ended) seen.current.add(id);
    for (const id of seen.current) if (!finished.some((t) => t.id === id)) seen.current.delete(id);
    if (ended.length) soundAlarm(audio.current);
  });

  const finishedStep = finished[0]?.step;
  useEffect(() => {
    if (finishedStep === undefined) return;
    title.current ??= document.title;
    document.title = finishTitle(title.current, finishedStep);
    return () => {
      document.title = title.current ?? document.title;
      title.current = undefined;
    };
  }, [finishedStep]);

  // The device is only known in the browser: false while rendering on the server and hydrating.
  const available = useSyncExternalStore(
    subscribeNever,
    () => clockAvailable(),
    () => false,
  );
  const [auto, setAuto] = useState(false);
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- localStorage may only be read after hydration
    setAuto(readClockSetting());
  }, []);

  // Starts the clock app's timer: an intent link, which the browser only follows from a tap.
  const startInClock = (seconds: number, step: number, label?: string) => {
    window.location.href = clockIntentUrl(seconds, label ?? `Stap ${step + 1}`);
  };

  const update = (change: (t: Timers, at: number) => Timers) => {
    const at = Date.now();
    setTimers((t) => change(t, at));
    setNow(at);
  };

  return {
    active: activeTimers(defs, timers, now),
    view: (id) => {
      const def = defs.find((d) => d.id === id);
      return def && timerView(timers, def, now);
    },
    start: (id) => {
      const def = defs.find((d) => d.id === id);
      if (!def) return;
      // Created in the tap that starts the timer: browsers only allow sound after a gesture.
      try {
        audio.current ??= new AudioContext();
        void audio.current.resume();
      } catch {
        // No Web Audio: the visual and title signals remain.
      }
      const toClock = available && auto;
      if (toClock) startInClock(def.minutes * 60, def.step, def.label);
      update((t, at) => startTimer(t, def, at, toClock));
    },
    add: (id, minutes) => update((t, at) => add(t, id, minutes, at)),
    stop: (id) => update((t) => stop(t, id)),
    handOver: (id) => {
      const def = defs.find((d) => d.id === id);
      const view = def && timerView(timers, def, Date.now());
      if (!def || view?.state !== 'running') return;
      startInClock(view.remainingMs / 1000, def.step, def.label);
      update((t, at) => handOver(t, id, view.remainingMs, at));
    },
    undoHandOver: (id) => update((t) => undoHandOver(t, id)),
    clock: {
      available,
      auto: available && auto,
      setAuto: (on) => {
        setAuto(on);
        writeClockSetting(on);
      },
    },
  };
}
