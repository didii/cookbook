import type { ComponentProps } from 'react';
import { cn } from './cn';

interface RowGripProps extends ComponentProps<'span'> {}

/** The drag handle of a row; hidden on screens without hover, where the buttons are the way to reorder. Pointer handlers come from `useReorder`. */
export function RowGrip({ className, ...props }: RowGripProps) {
  return (
    <span
      {...props}
      aria-hidden="true"
      className={cn('grid cursor-grab touch-none place-items-center text-ink/40 select-none [@media(hover:none)]:hidden', className)}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 fill-current">
        {[8, 16].flatMap((x) => [6, 12, 18].map((y) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.6" />))}
      </svg>
    </span>
  );
}
