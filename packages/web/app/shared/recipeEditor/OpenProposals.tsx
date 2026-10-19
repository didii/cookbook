import { useRef } from 'react';

type Props = {
  /** How many proposals of pinned chips are open. */
  count: number;
};

/** The save bar's note on open proposals: a button that moves focus to the accept button of the first one, and to the next on each use. Nothing when there are none; saving is never blocked by them. */
export function OpenProposals({ count }: Props) {
  const next = useRef(0);
  if (!count) return null;
  const jump = () => {
    const accept = [...document.querySelectorAll<HTMLElement>('[data-proposal]')];
    if (!accept.length) return;
    accept[next.current % accept.length].focus();
    next.current = (next.current + 1) % accept.length;
  };
  return (
    <button type="button" onClick={jump} className="min-h-11 cursor-pointer border-0 bg-transparent p-0 font-black text-blu underline">
      {count === 1 ? '1 voorstel open' : `${count} voorstellen open`}
    </button>
  );
}
