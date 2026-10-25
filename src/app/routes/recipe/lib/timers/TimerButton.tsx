import type { ComponentProps } from 'react';
import { cn } from '~app/shared/cn';

interface TimerButtonProps extends ComponentProps<'button'> {
  main?: boolean;
}

/** A control of a running or finished timer (+1, +5, stop, Klaar). */
export function TimerButton({ main, className, ...props }: TimerButtonProps) {
  return (
    <button
      {...props}
      type="button"
      className={cn(
        'inline-flex min-h-11 min-w-12 cursor-pointer items-center justify-center gap-1.5 rounded-lg border-3 border-ink bg-white px-2.5 font-black text-ink hover:bg-yel motion-safe:active:translate-px ',
        main && 'bg-ink text-por hover:bg-jade hover:text-white',
        className,
      )}
    />
  );
}
