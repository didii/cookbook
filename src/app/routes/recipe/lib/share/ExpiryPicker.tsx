import { cn } from '~app/shared/cn';
import { hoverTint } from '~app/shared/hover';
import { expiryChoices, type ExpiryChoice } from '~app/shared/shareExpiry';

type Props = {
  /** The choice shown; empty for none (the placeholder). */
  value: ExpiryChoice | '';
  onChoose: (choice: ExpiryChoice) => void;
  disabled?: boolean;
};

/** The dropdown with the six end dates. The placeholder is not a choice, so every real option, also the one that matches the stored date, fires `onChoose` when picked. */
export function ExpiryPicker({ value, onChoose, disabled }: Props) {
  return (
    <label className="flex flex-wrap items-center gap-x-3 gap-y-1 font-extrabold">
      Geldig voor
      <select
        data-testid="ExpiryPicker-select"
        value={value}
        disabled={disabled}
        onChange={(e) => onChoose(e.target.value as ExpiryChoice)}
        className={cn('min-h-11 cursor-pointer rounded-[10px] border-3 border-ink bg-white px-3 disabled:cursor-not-allowed disabled:opacity-40', hoverTint)}
      >
        <option value="" disabled data-testid="ExpiryPicker-placeholder">
          Kies…
        </option>
        {expiryChoices.map((c) => (
          <option key={c.value} value={c.value} data-testid="ExpiryPicker-option">
            {c.label}
          </option>
        ))}
      </select>
    </label>
  );
}
