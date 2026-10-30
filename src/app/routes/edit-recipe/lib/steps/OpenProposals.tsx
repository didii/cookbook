import { useRef, type ComponentProps } from 'react';
import { cn } from '~app/shared/cn';

/** Marks the accept button of each open proposal, so that the note can find them. */
export const proposalAttribute = 'data-proposal';

interface OpenProposalsProps extends ComponentProps<'button'> {
  /** How many proposals of pinned chips are open. */
  count: number;
}

/** The save bar's note on open proposals: a button that moves focus to the accept button of the first one, and to the next on each use. Nothing when there are none; saving is never blocked by them. */
export function OpenProposals({ count, className, ...props }: OpenProposalsProps) {
  const next = useRef(0);
  if (!count) return null;
  const jump = () => {
    const accept = [...document.querySelectorAll<HTMLElement>(`[${proposalAttribute}]`)];
    if (!accept.length) return;
    accept[next.current % accept.length].focus();
    next.current = (next.current + 1) % accept.length;
  };
  return (
    <button
      {...props}
      type="button"
      data-testid="OpenProposals-link"
      onClick={jump}
      className={cn('min-h-11 cursor-pointer border-0 bg-transparent p-0 font-black text-blu underline hover:text-red', className)}
    >
      {count === 1 ? '1 voorstel open' : `${count} voorstellen open`}
    </button>
  );
}
