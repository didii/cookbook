import type { ComponentProps } from 'react';
import { cn } from '../cn';

interface PillProps extends ComponentProps<'span'> {
  /** `tag` is cream, `category` is yellow so the two are told apart by colour, `dashed` is an outline for what is not a tag ("+2", "Zonder categorie"). */
  variant?: 'tag' | 'category' | 'dashed';
}

const variants = { tag: 'bg-por', category: 'bg-yel', dashed: 'border-dashed' };

/** The rounded label for a tag or a category. */
export function Pill({ variant = 'tag', className, ...props }: PillProps) {
  return (
    <span
      {...props}
      className={cn('rounded-full border-2 border-ink px-2.5 text-[0.8125rem] leading-[1.45] font-extrabold', variants[variant], className)}
    />
  );
}
