import type { ComponentProps } from 'react';
import { cn } from '../cn';
import { seals } from '../seals';

interface SealProps extends ComponentProps<'img'> {
  sealId: string;
}

/** Red chop stamped over a photo, tilted a little differently per seal. The white characters let the photo show through. */
export function Seal({ sealId, className, style, ...props }: SealProps) {
  const tilt = (seals.indexOf(sealId) % 5) * 4 - 8;
  return (
    <img
      {...props}
      data-testid="Seal-image"
      src={`/img/seal/${sealId}.svg`}
      alt=""
      className={cn('absolute top-2.5 right-2.5 z-1 w-auto opacity-95 mix-blend-multiply', className)}
      style={{ transform: `rotate(${tilt}deg)`, ...style }}
    />
  );
}
