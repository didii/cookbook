import { useEffect, useState, type RefObject } from 'react';

/** The indexes of the steps that are on screen, below the tab bar (not the timer row, so the row appearing cannot change the answer). */
export function useStepsInView(stack: RefObject<HTMLElement | null>, count: number) {
  const [inView, setInView] = useState<ReadonlySet<number>>(new Set());

  useEffect(() => {
    const bar = stack.current?.firstElementChild?.getBoundingClientRect().height ?? 0;
    const observer = new IntersectionObserver(
      (entries) =>
        setInView((prev) => {
          const next = new Set(prev);
          for (const entry of entries) {
            const step = Number(entry.target.id.slice('step-'.length)) - 1;
            if (entry.isIntersecting) next.add(step);
            else next.delete(step);
          }
          return next;
        }),
      { rootMargin: `-${bar}px 0px 0px 0px` },
    );
    for (let i = 1; i <= count; i++) {
      const el = document.getElementById(`step-${i}`);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [stack, count]);

  return inView;
}
