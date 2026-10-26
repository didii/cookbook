import type { ComponentProps } from 'react';
import { cn } from '../cn';
import { tiles, tileSteps } from '../tile';

interface TileBandProps extends ComponentProps<'div'> {
  first: number;
  responsive?: boolean;
  rows?: number;
}

interface PatternProps extends ComponentProps<'div'> {
  file: string;
  cols: number;
  rows: number;
}

/** The box is `cols` x `rows` tiles, so the height follows the width and the tiles scale to fit exactly, without seams. A CSS background, because an SVG `<pattern>` rendered as a white bar in Firefox on mobile. */
function Pattern({ file, cols, rows, className, style, ...props }: PatternProps) {
  return (
    <div
      {...props}
      data-testid="TileBand-band"
      className={cn('w-full', className)}
      style={{ ...style, aspectRatio: `${cols} / ${rows}`, backgroundImage: `url(${file})`, backgroundSize: `${100 / cols}% auto` }}
      aria-hidden="true"
    />
  );
}

/** One tile repeated across the width: 7 whole tiles, or with `responsive` more as the `@container` ancestor gets wider. */
export function TileBand({ first, responsive, rows = 1, className, ...props }: TileBandProps) {
  const file = `/img/tile/${tiles[first % tiles.length]}.svg`;
  if (!responsive) {
    return <Pattern {...props} file={file} cols={7} rows={rows} className={cn('block', className)} />;
  }
  return tileSteps.map(([cols, show]) => <Pattern {...props} key={cols} file={file} cols={cols} rows={rows} className={cn(show, className)} />);
}
