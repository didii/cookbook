/** What a list can ask of a row it renders. */
export type ItemHandle = {
  /** Focus the field with the caret at the start or end of its text. */
  focusField: (caret: 'start' | 'end') => void;
  /** Where the row is on the page, for dragging. */
  rect: () => DOMRect | undefined;
};
