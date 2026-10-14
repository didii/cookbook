import type { ComponentProps } from 'react';

import { cn } from '~/shared/cn';

type Props = ComponentProps<'button'> & { main?: boolean };

export function Button({ main, className, ...props }: Props) {
  return (
    <button
      className={cn(
        'min-h-13 flex-1 cursor-pointer rounded-[0.625rem] border-3 border-ink bg-white text-lg font-black text-ink shadow-hard-sm',
        'active:not-disabled:translate-x-0.5 active:not-disabled:translate-y-0.5 active:not-disabled:shadow-[1px_1px_0_var(--color-ink)]',
        'disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none',
        main && 'bg-blu text-white',
        className,
      )}
      {...props}
    />
  );
}
