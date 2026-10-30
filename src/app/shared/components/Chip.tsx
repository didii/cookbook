import type { ComponentProps } from 'react';
import { cn } from '../cn';
import { control } from '../control';

interface ChipProps extends ComponentProps<'button'> {
  pressed: boolean;
}

/** A toggle: white when off, yellow when on. */
export function Chip({ pressed, className, ...props }: ChipProps) {
  return (
    <button
      {...props}
      type="button"
      aria-pressed={pressed}
      className={cn(
        control,
        'min-h-10 rounded-full bg-white px-3.5 font-extrabold hover:not-aria-pressed:bg-hover aria-pressed:bg-yel aria-pressed:hover:brightness-95',
        className,
      )}
    />
  );
}
