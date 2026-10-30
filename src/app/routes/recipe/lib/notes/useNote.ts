import { useCallback, useEffect, useRef, useState } from 'react';
import { isSessionExpired } from '~app/shared/isSessionExpired';
import { keepNote, takeNote } from './keptNote';

/** How long typing must pause before the note saves by itself: slower typing on a narrow screen, so longer there. */
export const pauseMs = (narrow: boolean) => (narrow ? 5000 : 2000);
/** How long the saved cue stays before it starts to fade. */
const cueMs = 3000;

export type Cue = 'off' | 'shown' | 'fading';
export type Note = ReturnType<typeof useNote>;

/**
 * The member's note on the recipe page: the text, saving it, and the saved cue. One state for both presentations (narrow sheet, wide panel).
 * It is the only place that decides whether anything changed: saving compares with the text last stored, and the components only call
 * `open`, `dismiss`, `change` and `blur`. The text starts from `saved` and is never taken back from the loader, so a refresh cannot overwrite typing.
 */
export function useNote(slug: string, saved: string, narrow: boolean, email = '') {
  const [text, setText] = useState(saved);
  const [isOpen, setIsOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const [savedSinceOpen, setSavedSinceOpen] = useState(false);
  const [cue, setCue] = useState<Cue>('off');

  const latest = useRef(text);
  const stored = useRef(saved);
  const open = useRef(false);
  const inFlight = useRef(false);
  const alive = useRef(true);
  const wasFailed = useRef(false);
  const pause = useRef<ReturnType<typeof setTimeout>>(undefined);
  const cueTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const narrowNow = useRef(narrow);
  useEffect(() => {
    narrowNow.current = narrow;
  }, [narrow]);

  const showCue = () => {
    clearTimeout(cueTimer.current);
    setCue('shown');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    cueTimer.current = setTimeout(() => setCue(reduced ? 'off' : 'fading'), cueMs);
  };
  const clearCue = useCallback(() => {
    clearTimeout(cueTimer.current);
    setCue('off');
  }, []);

  // keepalive lets the request outlive the page (pagehide, leaving the route).
  const post = useCallback(
    async (body: string) => {
      try {
        return (await fetch(`/recepten/${slug}/notitie`, { method: 'POST', body: new URLSearchParams({ note: body }), keepalive: true })).ok;
      } catch {
        return false;
      }
    },
    [slug],
  );

  /** Stores the text when it differs from what was stored last; one request at a time. Returns after the request is done. */
  const save = useCallback(async (): Promise<void> => {
    clearTimeout(pause.current);
    if (latest.current === stored.current || inFlight.current) return;
    inFlight.current = true;
    // Typing may go on while a request is out, so repeat until what was stored is the current text.
    while (latest.current !== stored.current) {
      const sent = latest.current;
      const ok = await post(sent);
      if (ok) stored.current = sent;
      // After unmount only the request matters: no state, no cue.
      if (!alive.current) break;
      if (!ok) {
        // An expired Access session fails every request: keep the text and sign in again; the reload brings the text back.
        if (await isSessionExpired(location.href)) {
          keepNote(email, slug, latest.current);
          location.reload();
          return;
        }
        inFlight.current = false;
        // A failed save must not vanish with the closed field: the text is still there, so the field comes back.
        // Only once: when the member closes it again after a failure, it stays closed (a failure that never heals must not trap them).
        if (narrowNow.current && !wasFailed.current) {
          open.current = true;
          setIsOpen(true);
        }
        wasFailed.current = true;
        setFailed(true);
        return;
      }
      wasFailed.current = false;
      setFailed(false);
      setSavedSinceOpen(latest.current === sent);
      if (!open.current) showCue();
    }
    inFlight.current = false;
  }, [post, email, slug]);

  const change = (next: string) => {
    latest.current = next;
    setText(next);
    setSavedSinceOpen(false);
    clearTimeout(pause.current);
    pause.current = setTimeout(() => void save(), pauseMs(narrowNow.current));
  };

  useEffect(() => {
    const leave = () => {
      clearTimeout(pause.current);
      // A request is out and the member typed on: the loop in `save` may never get to send the rest, so send it now (the server keeps the last write).
      if (inFlight.current && latest.current !== stored.current) void post(latest.current);
      else void save();
    };
    window.addEventListener('pagehide', leave);
    return () => {
      window.removeEventListener('pagehide', leave);
      clearTimeout(cueTimer.current);
      leave();
    };
  }, [save, post]);

  // A text kept before a sign-in comes back as typed: it shows in the field and is saved again after the pause.
  useEffect(() => {
    const kept = takeNote(email, slug);
    if (kept !== undefined && kept !== stored.current) change(kept);
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- only on arrival at the recipe
  }, [email, slug]);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  return {
    text,
    isOpen,
    failed,
    savedSinceOpen,
    cue,
    change,
    clearCue,
    /** The cue's fade has finished. */
    endCue: () => setCue('off'),
    open: () => {
      open.current = true;
      setIsOpen(true);
      setSavedSinceOpen(false);
    },
    /** Closes the field (narrow) and stores a changed text. */
    dismiss: () => {
      open.current = false;
      setIsOpen(false);
      void save();
    },
    /** The wide field lost focus: stores a changed text. */
    blur: () => void save(),
  };
}
