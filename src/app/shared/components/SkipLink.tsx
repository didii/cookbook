import type { ComponentProps } from 'react';
import { cn } from '../cn';

interface SkipLinkProps extends ComponentProps<'a'> {}

export function SkipLink({ className, ...props }: SkipLinkProps) {
  return (
    <a
      {...props}
      className={cn(
        'absolute left-[-999px] focus:top-4 focus:left-4 focus:z-10 focus:border-3 focus:border-ink focus:bg-white focus:px-4 focus:py-2',
        className,
      )}
      href="#main"
    >
      Naar de inhoud
    </a>
  );
}
