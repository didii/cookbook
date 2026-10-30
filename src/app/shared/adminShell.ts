/** The grid of the admin area: the layout and the bars fixed to the bottom share it, so a bar starts where the content starts. */
export const shellFrame = 'mx-auto max-w-272 px-[max(1rem,4vw)]';
/** One column below 64rem; from there the navigation column (14rem) and the content. */
export const shellColumns = 'grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[14rem_minmax(0,1fr)] gap-5 lg:gap-12';
/** The content column; in a bar that has only this child it skips the navigation column. */
export const shellContent = 'min-w-0 max-w-3xl lg:col-start-2';
