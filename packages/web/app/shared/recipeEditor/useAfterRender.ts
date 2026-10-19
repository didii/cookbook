import { useLayoutEffect, useRef } from 'react';

/**
 * Work to do once the component has re-rendered, such as focusing something that moved. The request is dropped when no render follows (the move changed nothing), so it never fires for a later, unrelated render.
 * Returns the function that makes a request; a newer request replaces an older one.
 */
export function useAfterRender() {
  const task = useRef<() => void>(undefined);
  useLayoutEffect(() => {
    const run = task.current;
    task.current = undefined;
    run?.();
  });
  return (run: () => void) => {
    task.current = run;
    setTimeout(() => (task.current = undefined));
  };
}
