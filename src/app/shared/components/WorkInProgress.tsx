import type { ComponentProps } from 'react';
import { cn } from '../cn';

interface WorkInProgressProps extends ComponentProps<'main'> {
  headingText: string;
}

export function WorkInProgress({ headingText, className, ...props }: WorkInProgressProps) {
  return (
    <main {...props} id="main" className={cn('mx-auto max-w-3xl px-[max(1rem,4vw)] pt-8 pb-16', className)}>
      <h1 className="text-[clamp(2rem,6vw,3rem)] leading-[1.05] font-black tracking-[-0.03em]">{headingText}</h1>
      <output data-testid="WorkInProgress-banner" className="mt-6 block border-3 border-ink bg-yel p-4 font-bold">
        Dit scherm is nog in aanbouw
      </output>
    </main>
  );
}
