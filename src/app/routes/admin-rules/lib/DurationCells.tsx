interface DurationCellsProps {
  /** Accessible names of the fields, e.g. "Duur 2". */
  label: string;
  minutes: string;
  fixed: boolean;
  onChange: (patch: { minutes?: string; fixed?: boolean }) => void;
}

/** The cells a duration row has after its word: the minutes, with a "min" suffix, and the checkbox "Vast". They are grid cells of the row. */
export function DurationCells({ label, minutes, fixed, onChange }: DurationCellsProps) {
  return (
    <>
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          data-testid="DurationCells-minutes"
          aria-label={`${label}: minuten`}
          value={minutes}
          autoComplete="off"
          onChange={(e) => onChange({ minutes: e.target.value })}
          className="block min-h-10 w-full rounded-[0.625rem] border-3 border-ink bg-white py-0 pr-10 pl-2.5 text-right text-base leading-[1.4] font-bold text-ink hover:not-focus:bg-ink/5 focus:shadow-focus focus:outline-transparent"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-[0.8125rem] font-extrabold text-muted"
        >
          min
        </span>
      </div>
      <label className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 px-1 font-extrabold max-sm:col-[2/4] max-sm:row-2">
        <input
          type="checkbox"
          data-testid="DurationCells-fixed"
          checked={fixed}
          onChange={(e) => onChange({ fixed: e.target.checked })}
          className="size-5 accent-blu"
        />
        Vast
      </label>
    </>
  );
}
