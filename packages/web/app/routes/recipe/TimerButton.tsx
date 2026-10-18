import type { ComponentProps } from 'react';
import { cn } from '~/shared/cn';

type Props = ComponentProps<'button'> & { main?: boolean };

/** A control of a running or finished timer (+1, +5, stop, Klaar). */
export function TimerButton({ main, className, ...props }: Props) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex min-h-11 min-w-12 cursor-pointer items-center justify-center gap-1.5 rounded-lg border-3 border-ink bg-white px-2.5 font-black text-ink',
        main && 'bg-ink text-por',
        className,
      )}
      {...props}
    />
  );
}
