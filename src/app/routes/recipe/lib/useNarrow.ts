import { useSyncExternalStore } from 'react';

const wide = '(min-width: 52rem)';

const subscribe = (onChange: () => void) => {
  const query = matchMedia(wide);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
};

/** Whether the screen is narrower than 52rem. Only for behaviour (cook mode, the note's autosave pause); the layout itself is switched by CSS at the same 52rem, so keep the two in step. Assumes narrow while rendering on the server. */
export const useNarrow = () =>
  useSyncExternalStore(
    subscribe,
    () => !matchMedia(wide).matches,
    () => true,
  );
