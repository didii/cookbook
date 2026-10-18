import { useEffect, useRef, useState } from 'react';
import { createWakeLock, type LockState } from '~/lib/cookMode';

/** Keeps the screen awake while `wanted`; asks again when the page shows after being hidden and lets go when the page is left. */
export function useWakeLock(wanted: boolean): LockState {
  const [state, setState] = useState<LockState>('off');
  const lock = useRef<ReturnType<typeof createWakeLock>>(undefined);

  useEffect(() => {
    const created = createWakeLock(navigator, setState);
    lock.current = created;
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void created.shown();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      void created.dispose();
      lock.current = undefined;
    };
  }, []);

  useEffect(() => {
    void lock.current?.setWanted(wanted);
  }, [wanted]);

  return state;
}
