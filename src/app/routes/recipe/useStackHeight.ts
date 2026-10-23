import { useEffect, useRef, type RefObject } from 'react';

/**
 * Measures the sticky stack (tab bar, and the timer row when it shows) and publishes it as `--stack-h`, so scroll margins and the minimum
 * height of the panels follow what is really on screen. Returns a ref to the latest height in px for scroll calculations.
 */
export function useStackHeight(stack: RefObject<HTMLElement | null>) {
  const height = useRef(0);

  useEffect(() => {
    const el = stack.current;
    if (!el) return;
    const measure = () => {
      height.current = [...el.children].reduce((sum, child) => sum + child.getBoundingClientRect().height, 0);
      document.documentElement.style.setProperty('--stack-h', `${height.current}px`);
    };
    const observer = new ResizeObserver(measure);
    for (const child of el.children) observer.observe(child);
    measure();
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty('--stack-h');
    };
  }, [stack]);

  return height;
}
