/**
 * Cook mode keeps the screen awake. It starts by itself once cooking has started, until the switch is used: after that the switch decides.
 * Plain component state, never stored: a reload or another recipe starts automatic again.
 */
export type CookState = {
  /** Cooking has started (latched): the open tab's first item reached the middle of the screen, or an ingredient was ticked. */
  started: boolean;
  /** Set by the switch; undefined means automatic. */
  manual: boolean | undefined;
};

export const initialCook: CookState = { started: false, manual: undefined };

/** What the page looks like now: the top of the first item of the open tab (the same rule for both tabs), the window height and how many ingredients are ticked. */
export type Sighting = { firstItemTop: number; viewportHeight: number; ticked: number };

export function observe(state: CookState, { firstItemTop, viewportHeight, ticked }: Sighting): CookState {
  if (state.started || (ticked === 0 && firstItemTop >= viewportHeight / 2)) return state;
  return { ...state, started: true };
}

/** The switch was used: from now on only it decides. */
export const setByHand = (state: CookState, on: boolean): CookState => ({ ...state, manual: on });

/** Whether the screen should stay awake. Never on a wide screen. */
export const wantsCookMode = (state: CookState, narrow: boolean) => narrow && (state.manual ?? state.started);

/** What the lock actually is, as the wake lock reports it. */
export type LockState = 'unsupported' | 'off' | 'on' | 'refused';

/** The switch says what is, not what was asked for. */
export function switchText(wanted: boolean, lock: LockState, manual: boolean | undefined) {
  if (wanted && (lock === 'unsupported' || lock === 'refused'))
    return { title: 'Scherm kan niet wakker blijven', sub: 'Je browser staat dit niet toe' };
  const sub = manual !== undefined ? 'Handmatig' : wanted ? 'Automatisch, tik om uit te zetten' : 'Gaat vanzelf aan zodra je begint';
  return { title: wanted && lock === 'on' ? 'Scherm blijft aan' : 'Scherm mag slapen', sub };
}

type Sentinel = { release(): Promise<void>; addEventListener(type: 'release', listener: () => void): void };
type WakeLockNavigator = { wakeLock?: { request(type: 'screen'): Promise<Sentinel> } };

/** Holds a screen wake lock while wanted. The browser drops it when the page is hidden, so it is asked for again when the page shows. */
export function createWakeLock(nav: WakeLockNavigator, onState: (state: LockState) => void) {
  let wanted = false;
  let sentinel: Sentinel | undefined;
  let asking = false;
  const report = (state: LockState) => onState(state);
  report(nav.wakeLock ? 'off' : 'unsupported');

  async function acquire() {
    if (!nav.wakeLock) return report('unsupported');
    if (sentinel || asking) return;
    asking = true;
    try {
      const lock = await nav.wakeLock.request('screen');
      if (!wanted) return void (await lock.release());
      sentinel = lock;
      lock.addEventListener('release', () => {
        if (sentinel !== lock) return;
        sentinel = undefined;
        report('off');
      });
      report('on');
    } catch {
      report('refused');
    } finally {
      asking = false;
    }
  }

  async function release() {
    const lock = sentinel;
    sentinel = undefined;
    report(nav.wakeLock ? 'off' : 'unsupported');
    try {
      await lock?.release();
    } catch {
      // Already released by the browser.
    }
  }

  return {
    setWanted(next: boolean) {
      wanted = next;
      return next ? acquire() : release();
    },
    /** Call when the page becomes visible again. */
    shown() {
      if (wanted && !sentinel) return acquire();
    },
    /** Call when the page is left. */
    dispose() {
      wanted = false;
      return release();
    },
  };
}
