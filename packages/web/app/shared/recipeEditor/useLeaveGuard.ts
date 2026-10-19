import { useEffect, useRef } from 'react';
import { useBlocker } from 'react-router';

const message = 'Je wijzigingen zijn nog niet bewaard. Toch weggaan?';

/** Asks for confirmation before leaving the page, by a link or by closing or reloading, while `isGuarded()` is true. */
export function useLeaveGuard(isGuarded: () => boolean) {
  // Always the latest function, so the blocker and the listener never act on a stale answer.
  const latest = useRef(isGuarded);
  useEffect(() => {
    latest.current = isGuarded;
  });
  const blocker = useBlocker(() => latest.current());

  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    if (window.confirm(message)) blocker.proceed();
    else blocker.reset();
  }, [blocker]);

  useEffect(() => {
    const onUnload = (e: BeforeUnloadEvent) => {
      if (latest.current()) e.preventDefault();
    };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, []);
}
