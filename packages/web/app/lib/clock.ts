/** Only Android Chrome can start the clock app's timer from a page (an `intent:` link); there is no equivalent for iPhone or desktop. */
export const clockAvailable = (nav: Pick<Navigator, 'userAgent'> | undefined = typeof navigator === 'undefined' ? undefined : navigator) =>
  !!nav && /Android/i.test(nav.userAgent);

/** An `intent:` link that starts a timer in the clock app without opening it. Must be followed from a tap. */
export const clockIntentUrl = (seconds: number, label: string) =>
  [
    'intent:#Intent',
    'action=android.intent.action.SET_TIMER',
    `i.android.intent.extra.alarm.LENGTH=${Math.max(1, Math.round(seconds))}`,
    `S.android.intent.extra.alarm.MESSAGE=${encodeURIComponent(label)}`,
    'B.android.intent.extra.alarm.SKIP_UI=true',
    'end',
  ].join(';');

const KEY = 'clock-app-for-all-timers';

/** The setting "hand every timer to the clock app", off by default. Browser storage can be missing or blocked, so every access is guarded. */
export function readClockSetting(storage?: Pick<Storage, 'getItem'>) {
  try {
    return (storage ?? localStorage).getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function writeClockSetting(on: boolean, storage?: Pick<Storage, 'setItem' | 'removeItem'>) {
  try {
    const s = storage ?? localStorage;
    if (on) s.setItem(KEY, '1');
    else s.removeItem(KEY);
  } catch {
    // Not kept: the setting is a convenience.
  }
}
