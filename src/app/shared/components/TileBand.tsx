import { useId, type ComponentProps } from 'react';
import { cn } from '../cn';
import { tiles, tileSteps } from '../tile';

interface TileBandProps extends ComponentProps<'svg'> {
  first: number;
  responsive?: boolean;
  rows?: number;
}

interface PatternProps extends ComponentProps<'svg'> {
  file: string;
  cols: number;
  rows: number;
}

/** The viewBox is `cols` x `rows` tiles, so the height follows the width and the tiles scale to fit exactly, without seams. */
function Pattern({ file, cols, rows, className, ...props }: PatternProps) {
  const id = useId();
  return (
    <svg
      {...props}
      data-testid="TileBand-band"
      viewBox={`0 0 ${cols} ${rows}`}
      className={cn('w-full border-b-3 border-ink', className)}
      aria-hidden="true"
    >
      <pattern id={id} width="1" height="1" patternUnits="userSpaceOnUse">
        <image href={file} width="1" height="1" />
      </pattern>
      <rect width={cols} height={rows} fill={`url(#${id})`} />
    </svg>
  );
}

/** One tile repeated across the width: 7 whole tiles, or with `responsive` more as the `@container` ancestor gets wider. */
export function TileBand({ first, responsive, rows = 1, className, ...props }: TileBandProps) {
  const file = `/img/tile/${tiles[first % tiles.length]}.svg`;
  if (!responsive) return <Pattern {...props} file={file} cols={7} rows={rows} className={cn('block', className)} />;
  return tileSteps.map(([cols, show]) => <Pattern {...props} key={cols} file={file} cols={cols} rows={rows} className={cn(show, className)} />);
}
