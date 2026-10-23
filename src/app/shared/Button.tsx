import type { ComponentProps } from 'react';
import { cn } from '~app/shared/cn';
import { press } from '~app/shared/press';

type Props = ComponentProps<'button'> & { main?: boolean };

export function Button({ main, className, ...props }: Props) {
  return (
    <button
      className={cn(
        'min-h-13 flex-1 cursor-pointer rounded-[0.625rem] border-3 border-ink bg-white text-lg font-black text-ink',
        press,
        'hover:not-disabled:bg-ink/8',
        'disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none',
        main && 'bg-blu text-white hover:not-disabled:bg-blu hover:not-disabled:brightness-90',
        className,
      )}
      {...props}
    />
  );
}
