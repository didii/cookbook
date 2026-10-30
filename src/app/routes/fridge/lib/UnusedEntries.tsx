type Props = {
  /** The "Heb ik" entries that match no ingredient of the recipe. */
  entries: string[];
};

/** "Heb je, niet in dit recept": the entries the recipe does not use, struck through, each followed for screen readers by the reason. Nothing when there are none. */
export function UnusedEntries({ entries }: Props) {
  if (entries.length === 0) return null;
  return (
    <section data-testid="UnusedEntries-section" className="mt-3">
      <h3 data-testid="UnusedEntries-heading" className="mb-1 text-[0.9375rem] font-black text-muted">
        Heb je, niet in dit recept
      </h3>
      <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
        {entries.map((entry) => (
          <li
            key={entry}
            data-testid="UnusedEntries-item"
            className="rounded-lg border-2 border-dashed border-muted px-2.5 py-0.5 font-extrabold text-muted"
          >
            <span data-testid="UnusedEntries-entry" className="line-through decoration-red decoration-2">
              {entry}
            </span>
            <span data-testid="UnusedEntries-reason" className="sr-only">
              {' '}
              (niet in dit recept)
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
