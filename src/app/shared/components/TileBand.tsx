import { useId } from 'react';
import { cn } from '../cn';
import { tiles, tileSteps } from '../tile';

type Props = { first: number; responsive?: boolean; rows?: number; className?: string };

type PatternProps = { file: string; cols: number; rows: number; className?: string };

/** The viewBox is `cols` x `rows` tiles, so the height follows the width and the tiles scale to fit exactly, without seams. */
function Pattern({ file, cols, rows, className }: PatternProps) {
  const id = useId();
  return (
    <svg data-testid="TileBand-band" viewBox={`0 0 ${cols} ${rows}`} className={cn('w-full border-b-3 border-ink', className)} aria-hidden="true">
      <pattern id={id} width="1" height="1" patternUnits="userSpaceOnUse">
        <image href={file} width="1" height="1" />
      </pattern>
      <rect width={cols} height={rows} fill={`url(#${id})`} />
    </svg>
  );
}

/** One tile repeated across the width: 7 whole tiles, or with `responsive` more as the `@container` ancestor gets wider. */
export function TileBand({ first, responsive, rows = 1, className }: Props) {
  const file = `/img/tile/${tiles[first % tiles.length]}.svg`;
  if (!responsive) return <Pattern file={file} cols={7} rows={rows} className={cn('block', className)} />;
  return tileSteps.map(([cols, show]) => <Pattern key={cols} file={file} cols={cols} rows={rows} className={cn(show, className)} />);
}
