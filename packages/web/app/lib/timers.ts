import type { Step } from '~/lib/recipe';

/** The timer of a step. The id is the index of the step, so the order of the definitions is the order the recipe has. */
export type TimerDef = { id: string; step: number; minutes: number; label?: string };

/**
 * What is remembered of a timer that is not idle: the moment it ends and, once handed to the app, how much time was handed over.
 * The end time is kept while handed over, so the hand-over can be undone as if it never happened.
 */
export type Entry = { endsAt: number; handedOver?: number };
export type Timers = Record<string, Entry>;

export type TimerState = 'idle' | 'running' | 'finished' | 'native';
export type TimerView = TimerDef & { state: TimerState; remainingMs: number };

const MINUTE = 60_000;

export const timerDefs = (steps: Step[]): TimerDef[] =>
  steps.flatMap((s, step) => (s.timer ? [{ id: `${step}`, step, minutes: s.timer.minutes, label: s.timer.label }] : []));

/** State is derived from absolute end times, so a background tab or a reload cannot make a timer drift. */
export function timerView(timers: Timers, def: TimerDef, now: number): TimerView {
  const entry = timers[def.id];
  if (!entry) return { ...def, state: 'idle', remainingMs: def.minutes * MINUTE };
  if (entry.handedOver !== undefined) return { ...def, state: 'native', remainingMs: entry.handedOver };
  const remainingMs = Math.max(0, entry.endsAt - now);
  return { ...def, state: remainingMs > 0 ? 'running' : 'finished', remainingMs };
}

export const start = (timers: Timers, def: TimerDef, now: number): Timers => ({ ...timers, [def.id]: { endsAt: now + def.minutes * MINUTE } });

/** More time on a running timer; on a finished one it runs again for that time only. */
export function add(timers: Timers, id: string, minutes: number, now: number): Timers {
  const entry = timers[id];
  if (!entry || entry.handedOver !== undefined) return timers;
  return { ...timers, [id]: { endsAt: Math.max(entry.endsAt, now) + minutes * MINUTE } };
}

/** Back to the start state: stops a running timer, dismisses a finished one, removes a clock app note. */
export function stop(timers: Timers, id: string): Timers {
  const rest = { ...timers };
  delete rest[id];
  return rest;
}

/** Start a timer, or, with the app setting on, start it there right away: the page then only keeps the note. */
export const startTimer = (timers: Timers, def: TimerDef, now: number, handedOver: boolean): Timers =>
  handedOver ? handOver(start(timers, def, now), def.id, def.minutes * MINUTE, now) : start(timers, def, now);

/** Hand a running timer over to the app: the page stops counting it but remembers when it would end. */
export const handOver = (timers: Timers, id: string, remainingMs: number, now: number): Timers => ({
  ...timers,
  [id]: { endsAt: timers[id]?.endsAt ?? now + remainingMs, handedOver: remainingMs },
});

/** Take a timer back from the app: it runs, or has finished, exactly as if it had never been handed over. */
export function undoHandOver(timers: Timers, id: string): Timers {
  const entry = timers[id];
  return entry ? { ...timers, [id]: { endsAt: entry.endsAt } } : timers;
}

/** Stored form, for sessionStorage. */
export const serialize = (timers: Timers) => JSON.stringify(timers);

/** Read what `serialize` wrote; anything unreadable or not belonging to this recipe's timers is dropped. */
export function restore(raw: string | null, defs: TimerDef[]): Timers {
  let parsed: unknown;
  try {
    parsed = raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
  if (!parsed || typeof parsed !== 'object') return {};
  const timers: Timers = {};
  for (const def of defs) {
    const entry = (parsed as Record<string, unknown>)[def.id] as Record<string, unknown> | undefined;
    if (!entry || !Number.isFinite(entry.endsAt)) continue;
    timers[def.id] = { endsAt: entry.endsAt as number };
    if (Number.isFinite(entry.handedOver)) timers[def.id].handedOver = entry.handedOver as number;
  }
  return timers;
}

/** The timers that are counting or waiting to be dealt with, in the order of the recipe (not of the start). */
export const activeTimers = (defs: TimerDef[], timers: Timers, now: number) =>
  defs.map((def) => timerView(timers, def, now)).filter((t) => t.state === 'running' || t.state === 'finished');

/** Timers that have reached zero and were not known to be finished yet. */
export const newlyFinished = (defs: TimerDef[], timers: Timers, seen: ReadonlySet<string>, now: number) =>
  defs.filter((def) => !seen.has(def.id) && timerView(timers, def, now).state === 'finished').map((def) => def.id);

/** "14:32", or "1:05:00" from an hour on. */
export function formatCountdown(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}

/** The page title while a timer is finished: the step of the first one (0-based), else the original. */
export const finishTitle = (title: string, finishedStep: number | undefined) =>
  finishedStep === undefined ? title : `⏰ Stap ${finishedStep + 1} · ${title}`;
