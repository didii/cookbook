/** Where a dragged row would land: the number of other rows whose middle lies above the dragged row's middle. `mids` are the middles of the movable rows in their original order, `from` the dragged one's place. */
export const dropIndex = (mids: number[], from: number, center: number) => mids.filter((mid, j) => j !== from && mid < center).length;
