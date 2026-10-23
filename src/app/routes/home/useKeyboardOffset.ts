import { useEffect } from 'react';

/**
 * Publishes how far the on-screen keyboard covers the bottom of the layout viewport as `--kb`, so a fixed bar can sit above it.
 * Android resizes the layout viewport itself (`interactive-widget=resizes-content`), which makes this 0; iOS Safari does not, so there it is the gap.
 */
export function useKeyboardOffset() {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const update = () =>
      document.documentElement.style.setProperty('--kb', `${Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)}px`);
    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
      document.documentElement.style.removeProperty('--kb');
    };
  }, []);
}
