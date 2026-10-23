import { useId, useState } from 'react';
import { formatNumber, nextMultiplier, parseNumber } from './scale';

type Props = { value: number; onChange: (value: number) => void; servings: boolean };

const fractions: Record<string, string> = { '0.1': '1/10', '0.125': '1/8', '0.167': '1/6', '0.25': '1/4', '0.333': '1/3', '0.5': '1/2' };

/** Servings as whole numbers; the multiplier as a fraction on the ladder's fractions, else as a number. */
const shown = (value: number, servings: boolean) => (servings ? String(value) : (fractions[String(Number(value.toFixed(3)))] ?? formatNumber(value)));

const button =
  'inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-full border-3 border-ink bg-white text-xl leading-none font-black hover:bg-yel';

/** Minus and plus buttons around a field: the servings to cook for, or without servings a multiplier. */
export function ScaleControl({ value, onChange, servings }: Props) {
  // What is typed while it differs from the last valid value.
  const [draft, setDraft] = useState<string>();
  const fieldId = useId();

  const parse = (text: string) => {
    if (servings) return /^\d+$/.test(text.trim()) && Number(text) >= 1 ? Number(text) : undefined;
    const n = parseNumber(text);
    return n !== undefined && n > 0 ? n : undefined;
  };
  const step = (direction: 1 | -1) => {
    setDraft(undefined);
    onChange(servings ? Math.max(1, value + direction) : nextMultiplier(value, direction));
  };

  return (
    <div className="inline-flex flex-col gap-1">
      <label data-testid="ScaleControl-label" htmlFor={fieldId} className="font-extrabold">
        {servings ? 'Personen' : 'Vermenigvuldiger'}
      </label>
      <span className="inline-flex items-center gap-2">
        <button data-testid="ScaleControl-less" type="button" aria-label="Minder" onClick={() => step(-1)} className={button}>
          −
        </button>
        {!servings && (
          <span data-testid="ScaleControl-times" aria-hidden="true">
            ×
          </span>
        )}
        <input
          id={fieldId}
          data-testid="ScaleControl-field"
          type="text"
          inputMode="decimal"
          value={draft ?? shown(value, servings)}
          onChange={(e) => {
            setDraft(e.target.value);
            const n = parse(e.target.value);
            if (n !== undefined) onChange(n);
          }}
          onBlur={() => setDraft(undefined)}
          onKeyDown={(e) => e.key === 'Enter' && setDraft(undefined)}
          className="min-h-11 w-16 rounded-lg border-3 border-ink bg-white px-2 text-center font-extrabold tabular-nums"
        />
        <button data-testid="ScaleControl-more" type="button" aria-label="Meer" onClick={() => step(1)} className={button}>
          +
        </button>
      </span>
    </div>
  );
}
