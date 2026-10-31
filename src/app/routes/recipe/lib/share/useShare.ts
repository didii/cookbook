import { useEffect, useRef, useState } from 'react';
import type { ExpiryChoice } from '~app/shared/shareExpiry';

/** How long the checkmark stays before it starts to fade, and how long the fade takes. */
const checkMs = 2500;
const fadeMs = 500;

export type Check = 'off' | 'shown' | 'fading';
export type Share = ReturnType<typeof useShare>;

/**
 * The share popup's data: creates (or fetches) the member's share of the recipe on mount, stores the end date the member picks,
 * and holds what the popup shows (the dropdown or "Wijzig", the checkmark, the errors). The server decides every date: a choice is sent, never a date.
 */
export function useShare(slug: string) {
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [token, setToken] = useState('');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  // A share this very open made starts with the dropdown on "Nooit"; an existing one starts closed, behind "Wijzig", without a choice.
  const [picking, setPicking] = useState(false);
  const [choice, setChoice] = useState<ExpiryChoice | ''>('');
  const [check, setCheck] = useState<Check>('off');
  const [error, setError] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const response = await fetch(`/recepten/${slug}/delen`, { method: 'POST' });
        if (!response.ok) throw new Error(String(response.status));
        const share = (await response.json()) as { token: string; expiresAt: string | null; created: boolean };
        if (!alive) return;
        setToken(share.token);
        setExpiresAt(share.expiresAt);
        setPicking(share.created);
        setChoice(share.created ? 'never' : '');
        setState('ready');
      } catch {
        if (alive) setState('failed');
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const showCheck = () => {
    timers.current.forEach(clearTimeout);
    setCheck('shown');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    timers.current = [
      setTimeout(() => setCheck(reduced ? 'off' : 'fading'), checkMs),
      ...(reduced ? [] : [setTimeout(() => setCheck('off'), checkMs + fadeMs)]),
    ];
  };

  return {
    state,
    token,
    expiresAt,
    picking,
    choice,
    check,
    /** Storing the last choice failed; the end date shown is the earlier one. */
    error,
    /** "Wijzig": shows the dropdown, without a choice. */
    change: () => setPicking(true),
    /** Stores the end date that `value` gives, counted from now. */
    choose: async (value: ExpiryChoice) => {
      setError(false);
      try {
        const response = await fetch(`/recepten/${slug}/delen/verloop`, { method: 'POST', body: new URLSearchParams({ expires: value }) });
        if (!response.ok) throw new Error(String(response.status));
        const saved = (await response.json()) as { expiresAt: string | null };
        setExpiresAt(saved.expiresAt);
        setChoice(value);
        showCheck();
      } catch {
        setError(true);
      }
    },
  };
}
