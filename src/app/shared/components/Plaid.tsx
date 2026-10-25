import type { ComponentProps, CSSProperties } from 'react';
import { cn } from '../cn';

const plaidClassName =
  'bg-red bg-[repeating-linear-gradient(90deg,var(--plaid-ink)_0_calc(var(--plaid-cell)/2),transparent_calc(var(--plaid-cell)/2)_var(--plaid-cell)),repeating-linear-gradient(0deg,var(--plaid-ink)_0_calc(var(--plaid-cell)/2),transparent_calc(var(--plaid-cell)/2)_var(--plaid-cell))]';

const plaidStyle = (strength = 0.45, cell = 32) =>
  ({
    '--plaid-ink': `color-mix(in srgb, var(--color-ink) ${Math.round(strength * 100)}%, transparent)`,
    '--plaid-cell': `${cell}px`,
  }) as CSSProperties;

interface PlaidProps extends ComponentProps<'div'> {
  strength?: number;
  cell?: number;
}

/** Buffalo plaid on a red ground: ink bands cross both ways, `cell` px apart and `strength` (0 to 1) dark. Fills the nearest `relative` parent behind its content. */
export function Plaid({ strength = 0.45, cell = 32, className, style, ...props }: PlaidProps) {
  return (
    <div
      {...props}
      data-testid="Plaid-layer"
      aria-hidden="true"
      className={cn(plaidClassName, className)}
      style={{ ...plaidStyle(strength, cell), ...style }}
    />
  );
}
