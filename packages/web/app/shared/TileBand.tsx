import { cn } from "~/shared/cn";

type Props = { first: number; className?: string };

/** One tile repeated across the width; `round` scales it so only whole tiles fit. */
export function TileBand({ first, className }: Props) {
  return (
    <div
      className={cn("h-14 border-b-3 border-ink bg-size-[3.5rem_3.5rem] bg-repeat-round", className)}
      style={{ backgroundImage: `url(/img/tile${(first % 9) + 1}.svg)` }}
      aria-hidden="true"
    />
  );
}
