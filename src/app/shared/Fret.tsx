import { cn } from '~app/shared/cn';

type Props = { size: number; className?: string };

/** Key-fret (回纹) strip, `size` px high, drawn in the current text colour; `round` scales the spirals so only whole ones fit. */
export function Fret({ size, className }: Props) {
  const mask = 'url(/img/fret.svg)';
  return (
    <div
      className={cn('bg-current mask-repeat-round', className)}
      style={{ height: size, maskImage: mask, WebkitMaskImage: mask, maskSize: `${size}px ${size}px`, WebkitMaskSize: `${size}px ${size}px` }}
      aria-hidden="true"
    />
  );
}
