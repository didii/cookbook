import { useCallback, useEffect, useRef, useState } from 'react';
import type { RecipeDraft } from '~app/lib/draft';
import { browserStorage, saveDraft } from '~app/lib/draftStore';
import type { Rules } from '~app/lib/rules';

const delayMs = 400;

type Keeping = {
  key: string;
  /** The editor's state, and the state it started from (a draft equal to it is not kept). */
  state: RecipeDraft;
  initial: RecipeDraft;
  rules: Rules;
  /** The version of the stored recipe the draft is based on. */
  base: { updatedAt?: string };
  /** Whether a photo is still going up. */
  uploading: boolean;
  /** Nothing is written before the draft on the device has been read and restored, or it would be overwritten by the stored values. */
  ready: boolean;
  /** Whether a save is in progress. Nothing is written then (not by the timer, not when the page is hidden or the editor closes): a successful save has just removed the draft and must not see it come back. */
  isSaving: () => boolean;
};

/**
 * Keeps the editor's state on the device: 400 ms after each change, and at once when the page is hidden or closed, when the editor closes, and when `keepNow` is called.
 * `kept` tells whether the last write succeeded (false when storage is unavailable or full); `keepNow` writes now and returns the same answer.
 */
export function useDraftPersistence(keeping: Keeping) {
  const latest = useRef(keeping);
  // The image that was last settled, for the moments a photo is going up.
  const settledImage = useRef(keeping.state.image);
  useEffect(() => {
    latest.current = keeping;
    if (!keeping.uploading) settledImage.current = keeping.state.image;
  });
  // Storage that is blocked outright is known from the start; a full one shows on the first write.
  const [kept, setKept] = useState(() => browserStorage() !== undefined);

  const keepNow = useCallback(() => {
    const { key, state, initial, base, uploading, ready, isSaving, rules } = latest.current;
    if (!ready || isSaving()) return true;
    const { ok } = saveDraft(browserStorage(), key, { state, initial, base, uploading, settledImage: settledImage.current, now: new Date(), rules });
    setKept(ok);
    return ok;
  }, []);

  const { state, base, ready } = keeping;
  const first = useRef(true);
  useEffect(() => {
    if (!ready) return;
    // The state just restored (or just shown) is already what the device holds.
    if (first.current) {
      first.current = false;
      return;
    }
    const timer = setTimeout(keepNow, delayMs);
    return () => clearTimeout(timer);
  }, [state, base, ready, keepNow]);

  useEffect(() => {
    const onHidden = () => document.visibilityState === 'hidden' && keepNow();
    document.addEventListener('visibilitychange', onHidden);
    window.addEventListener('pagehide', keepNow);
    return () => {
      document.removeEventListener('visibilitychange', onHidden);
      window.removeEventListener('pagehide', keepNow);
      keepNow();
    };
  }, [keepNow]);

  return { kept, keepNow };
}
