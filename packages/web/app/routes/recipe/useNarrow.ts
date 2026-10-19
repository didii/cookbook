import { useSyncExternalStore } from 'react';

const wide = '(min-width: 52rem)';

const subscribe = (onChange: () => void) => {
  const query = matchMedia(wide);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
};

/** Whether the screen is narrower than 52rem. Only for behaviour (cook mode); the layout itself is switched by CSS. Assumes narrow while rendering on the server. */
export const useNarrow = () =>
  useSyncExternalStore(
    subscribe,
    () => !matchMedia(wide).matches,
    () => true,
  );
