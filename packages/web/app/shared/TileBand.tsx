import { useId } from 'react';

import { tiles } from '~/lib/tile';
import { cn } from '~/shared/cn';

type Props = { first: number; responsive?: boolean; rows?: number; className?: string };

/** Tile counts per width of the nearest `@container` ancestor, so tiles stay roughly 50-65px: [count, visibility classes]. */
const steps = [
  [6, 'block @min-[21rem]:hidden'],
  [8, 'hidden @min-[21rem]:block @min-[29rem]:hidden'],
  [10, 'hidden @min-[29rem]:block @min-[37rem]:hidden'],
  [14, 'hidden @min-[37rem]:block @min-[49rem]:hidden'],
  [18, 'hidden @min-[49rem]:block'],
] as const;

type PatternProps = { file: string; cols: number; rows: number; className?: string };

/** The viewBox is `cols` x `rows` tiles, so the height follows the width and the tiles scale to fit exactly, without seams. */
function Pattern({ file, cols, rows, className }: PatternProps) {
  const id = useId();
  return (
    <svg viewBox={`0 0 ${cols} ${rows}`} className={cn('w-full border-b-3 border-ink', className)} aria-hidden="true">
      <pattern id={id} width="1" height="1" patternUnits="userSpaceOnUse">
        <image href={file} width="1" height="1" />
      </pattern>
      <rect width={cols} height={rows} fill={`url(#${id})`} />
    </svg>
  );
}

/** One tile repeated across the width: 7 whole tiles, or with `responsive` more as the `@container` ancestor gets wider. */
export function TileBand({ first, responsive, rows = 1, className }: Props) {
  const file = `/img/${tiles[first % tiles.length]}.svg`;
  if (!responsive) return <Pattern file={file} cols={7} rows={rows} className={cn('block', className)} />;
  return steps.map(([cols, show]) => <Pattern key={cols} file={file} cols={cols} rows={rows} className={cn(show, className)} />);
}
