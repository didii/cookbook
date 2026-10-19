/** A change to a text: the characters `[start, start + removed)` of the old text were replaced by `inserted` characters of the new text, which start at `start` too. */
export type TextEdit = { start: number; removed: number; inserted: number };

/** The selection of the field just before a change. */
export type Selection = { start: number; end: number };

const isHigh = (text: string, i: number) => i >= 0 && i < text.length && text.charCodeAt(i) >= 0xd800 && text.charCodeAt(i) <= 0xdbff;
const isLow = (text: string, i: number) => i >= 0 && i < text.length && text.charCodeAt(i) >= 0xdc00 && text.charCodeAt(i) <= 0xdfff;

/** The edit by comparing the texts: everything before the first and after the last difference is unchanged. When the change is ambiguous (one of three equal letters deleted), the earliest place is chosen. */
function diff(prev: string, next: string): TextEdit {
  let start = 0;
  const shortest = Math.min(prev.length, next.length);
  while (start < shortest && prev[start] === next[start]) start++;
  let tail = 0;
  while (tail < shortest - start && prev[prev.length - 1 - tail] === next[next.length - 1 - tail]) tail++;
  return { start, removed: prev.length - start - tail, inserted: next.length - start - tail };
}

/** The edit the selection describes, when it describes the change exactly: the text before it and after the replaced part are unchanged. */
function fromSelection(prev: string, next: string, { start, end }: Selection): TextEdit | undefined {
  const inserted = next.length - (prev.length - (end - start));
  if (start < 0 || end < start || end > prev.length || inserted < 0) return undefined;
  return next.startsWith(prev.slice(0, start)) && next.slice(start + inserted) === prev.slice(end)
    ? { start, removed: end - start, inserted }
    : undefined;
}

/** Widens the edit so that it starts and ends between whole code points: a surrogate pair is never cut in two. Widening both sides by the same amount keeps the unchanged ends equal. */
function snap(prev: string, next: string, edit: TextEdit): TextEdit {
  let { start, removed, inserted } = edit;
  if (isHigh(prev, start - 1) && (isLow(prev, start) || isLow(next, start))) {
    start--;
    removed++;
    inserted++;
  }
  const oldEnd = start + removed;
  const newEnd = start + inserted;
  if ((isHigh(prev, oldEnd - 1) && isLow(prev, oldEnd)) || (isHigh(next, newEnd - 1) && isLow(next, newEnd))) {
    removed++;
    inserted++;
  }
  return { start, removed, inserted };
}

/**
 * Which characters of `prev` were replaced to get `next`, and by how many new ones.
 * The selection before the change (`hint`) gives the exact answer for typing, pasting over a selection, cutting and dropping; without it, or when it does not fit the texts (undo, redo, autofill, a deletion with a collapsed caret), the answer comes from comparing the texts, which is exact for any single contiguous change.
 */
export function computeEdit(prev: string, next: string, hint?: Selection): TextEdit {
  return snap(prev, next, (hint && fromSelection(prev, next, hint)) || diff(prev, next));
}
