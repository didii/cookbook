import { useCallback, useEffect, useRef, useState } from 'react';

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
export function useNote(slug: string, saved: string, narrow: boolean) {
  const [text, setText] = useState(saved);
  const [isOpen, setIsOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const [savedSinceOpen, setSavedSinceOpen] = useState(false);
  const [cue, setCue] = useState<Cue>('off');

  const latest = useRef(text);
  const stored = useRef(saved);
  const open = useRef(false);
  const inFlight = useRef(false);
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

  /** Stores the text when it differs from what was stored last; one request at a time. Returns after the request is done. */
  const save = useCallback(async (): Promise<void> => {
    clearTimeout(pause.current);
    if (latest.current === stored.current || inFlight.current) return;
    inFlight.current = true;
    const sent = latest.current;
    let ok = false;
    try {
      // keepalive lets the request outlive the page (pagehide, leaving the route).
      const response = await fetch(`/recepten/${slug}/notitie`, { method: 'POST', body: new URLSearchParams({ note: sent }), keepalive: true });
      ok = response.ok;
    } catch {
      ok = false;
    }
    inFlight.current = false;
    if (!ok) {
      setFailed(true);
      // A failed save must not vanish with the closed field: the text is still there, so the field comes back.
      if (narrowNow.current) {
        open.current = true;
        setIsOpen(true);
      }
      return;
    }
    stored.current = sent;
    setFailed(false);
    setSavedSinceOpen(latest.current === sent);
    if (!open.current) showCue();
    // Typing went on while the request was out.
    if (latest.current !== sent) await save();
  }, [slug]);

  const change = (next: string) => {
    latest.current = next;
    setText(next);
    setSavedSinceOpen(false);
    clearTimeout(pause.current);
    pause.current = setTimeout(() => void save(), pauseMs(narrowNow.current));
  };

  useEffect(() => {
    const leave = () => void save();
    window.addEventListener('pagehide', leave);
    return () => {
      window.removeEventListener('pagehide', leave);
      clearTimeout(pause.current);
      clearTimeout(cueTimer.current);
      void save();
    };
  }, [save]);

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
