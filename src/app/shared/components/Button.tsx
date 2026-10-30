import type { ComponentProps } from 'react';
import { cn } from '../cn';
import { hoverTint } from '../hover';
import { press } from '../press';

interface ButtonProps extends ComponentProps<'button'> {
  main?: boolean;
}

export function Button({ main, className, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        'min-h-13 flex-1 cursor-pointer rounded-[0.625rem] border-3 border-ink bg-white text-lg font-black text-ink',
        press,
        hoverTint,
        'disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none',
        main && 'bg-blu text-white hover:not-disabled:bg-blu hover:not-disabled:brightness-90',
        className,
      )}
    />
  );
}
