import type { ComponentProps } from 'react';
import { cn } from '../cn';

interface FretProps extends ComponentProps<'div'> {
  size: number;
}

/** Key-fret (回纹) strip, `size` px high, drawn in the current text colour; `round` scales the spirals so only whole ones fit. */
export function Fret({ size, className, style, ...props }: FretProps) {
  const mask = 'url(/img/fret.svg)';
  return (
    <div
      {...props}
      className={cn('bg-current mask-repeat-round', className)}
      style={{
        height: size,
        maskImage: mask,
        WebkitMaskImage: mask,
        maskSize: `${size}px ${size}px`,
        WebkitMaskSize: `${size}px ${size}px`,
        ...style,
      }}
      data-testid="Fret-strip"
      aria-hidden="true"
    />
  );
}
