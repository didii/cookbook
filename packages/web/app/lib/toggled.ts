/** A copy of the set with the value added, or removed when it was in. */
export const toggled = <T>(set: ReadonlySet<T>, value: T) => {
  const next = new Set(set);
  if (!next.delete(value)) next.add(value);
  return next;
};
