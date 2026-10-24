/** Tile files in /img/tile, in rotation order. `-blue` is the blue-and-white colourway; tiles 10 and 11 are the lotus and the rings. */
export const tiles = [
  'tile1',
  'tile10-blue',
  'tile5-blue',
  'tile11',
  'tile3',
  'tile11-blue',
  'tile7-blue',
  'tile10',
  'tile2',
  'tile4-blue',
  'tile9',
  'tile6-blue',
  'tile8',
  'tile1-blue',
  'tile2-blue',
  'tile3-blue',
  'tile4',
  'tile5',
  'tile6',
  'tile7',
  'tile8-blue',
  'tile9-blue',
];

/** Rotating tile for a recipe. Colour per person is not decided yet. */
export const tileFor = (i: number) => i % tiles.length;

/**
 * Tile counts of a responsive `TileBand` per width of the nearest `@container` ancestor, so tiles stay roughly 50-65px:
 * [count, visibility classes, aspect ratio of two tile rows at that width]. Classes are written out in full so Tailwind finds them.
 */
export const tileSteps = [
  [6, 'block @min-[21rem]:hidden', 'aspect-3/1'],
  [8, 'hidden @min-[21rem]:block @min-[29rem]:hidden', '@min-[21rem]:aspect-4/1'],
  [10, 'hidden @min-[29rem]:block @min-[37rem]:hidden', '@min-[29rem]:aspect-5/1'],
  [14, 'hidden @min-[37rem]:block @min-[49rem]:hidden', '@min-[37rem]:aspect-7/1'],
  [18, 'hidden @min-[49rem]:block', '@min-[49rem]:aspect-9/1'],
] as const;

/** Classes that make an element as high as two rows of a responsive `TileBand` in the same container. */
export const twoTileRows = tileSteps.map(([, , ratio]) => ratio).join(' ');
