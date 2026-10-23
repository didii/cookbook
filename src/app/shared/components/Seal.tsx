import { cn } from '../cn';
import { seals } from '../seals';

type Props = { id: string; className?: string };

/** Red chop stamped over a photo, tilted a little differently per seal. The white characters let the photo show through. */
export function Seal({ id, className }: Props) {
  const tilt = (seals.indexOf(id) % 5) * 4 - 8;
  return (
    <img
      src={`/img/seal/${id}.svg`}
      alt=""
      className={cn('absolute top-2.5 right-2.5 z-1 w-auto opacity-95 mix-blend-multiply', className)}
      style={{ transform: `rotate(${tilt}deg)` }}
    />
  );
}
