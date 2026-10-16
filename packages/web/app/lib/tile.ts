/** Tile files in /img, in rotation order. `-blue` is the blue-and-white colourway; tiles 10 and 11 are the lotus and the rings. */
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
