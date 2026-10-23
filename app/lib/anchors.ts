import type { TextEdit } from '~/lib/textEdit';

/** A range of a step's text: UTF-16 indexes, `end` exclusive. */
export type Range = { start: number; end: number };

/**
 * Where a range is after an edit, or undefined when the edit took all of its words away. The edit is what `StepText` reports (see `computeEdit`): the characters `[start, start + removed)` were replaced by `inserted` new ones.
 * Text before the range moves it, text inside stretches it, text typed exactly at an edge stays outside, an edit that cuts into an edge keeps what remains, and replacing all of the words puts the range on the new text. Because edits are indexes and lengths, a character of two code units needs no special case: it is `inserted = 2`.
 */
export function mapRange({ start: s, end: e }: Range, { start: a, removed: r, inserted: i }: TextEdit): Range | undefined {
  const shift = i - r;
  // Entirely before (this includes typing at the start edge) or entirely after (including typing at the end edge).
  if (a + r <= s) return { start: s + shift, end: e + shift };
  if (a >= e) return { start: s, end: e };
  // Inside, or exactly the range: the end follows.
  if (a >= s && a + r <= e) return e + shift > s ? { start: s, end: e + shift } : undefined;
  // Covers the range and more: the new text takes its place.
  if (a <= s && a + r >= e) return i > 0 ? { start: a, end: a + i } : undefined;
  // Cuts into the start edge: what remains starts after the new text.
  if (a < s) return { start: a + i, end: e + shift };
  // Cuts into the end edge.
  return { start: s, end: a };
}
