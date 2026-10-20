import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type Ref } from 'react';
import type { Chip, IngredientValues, OvenValues, TimerValues, Values } from '~/lib/chips';
import { cn } from '~/shared/cn';
import { Link, Pin, Trash } from '~/shared/icons';

type Props = {
  chip: Chip;
  /** What the chip shows now. */
  values: Values;
  /** The chip the popup belongs to, to place the popup under it and to ignore clicks on it. */
  anchor: () => HTMLElement | null | undefined;
  /** Changing a value pins the chip. */
  onValues: (patch: Partial<IngredientValues & OvenValues & TimerValues>) => void;
  onLabel: (label: string) => void;
  onMode: (mode: 'auto' | 'manual') => void;
  onRemove: () => void;
  /** Closes the popup; `refocus` when focus should go back to the chip. */
  onClose: (refocus: boolean) => void;
};

const inputClass =
  'mt-0.5 block min-h-11 w-full rounded-[0.625rem] border-2 border-ink bg-white px-3 text-base font-bold text-ink hover:not-focus:bg-[color-mix(in_srgb,var(--color-ink)_5%,white)]';
const labelClass = 'text-[0.8125rem] font-black text-muted';
const kindLabel = { ingredient: 'Ingrediënt', oven: 'Oven', timer: 'Timer' } as const;

/** A number field that only passes on a whole number above zero; while the text is not one, the chip keeps its last value. */
function NumberField({
  label,
  value,
  onValue,
  first,
}: {
  label: string;
  value: number;
  onValue: (n: number) => void;
  first?: Ref<HTMLInputElement>;
}) {
  const id = useId();
  const valid = (t: string) => /^[1-9]\d*$/.test(t);
  const [text, setText] = useState(String(value));
  // The chip took another value (it started following its words): show that, unless the text already says it.
  const [shown, setShown] = useState(value);
  if (shown !== value) {
    setShown(value);
    if (!valid(text) || Number(text) !== value) setText(String(value));
  }
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <input
        id={id}
        ref={first}
        value={text}
        inputMode="numeric"
        autoComplete="off"
        aria-invalid={valid(text) ? undefined : true}
        onChange={(e) => {
          setText(e.target.value);
          if (valid(e.target.value)) onValue(Number(e.target.value));
        }}
        className={cn(inputClass, 'aria-invalid:border-red')}
      />
    </div>
  );
}

function TextField({
  label,
  value,
  onValue,
  first,
}: {
  label: string;
  value: string;
  onValue: (text: string) => void;
  first?: Ref<HTMLInputElement>;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <input id={id} ref={first} value={value} autoComplete="off" onChange={(e) => onValue(e.target.value)} className={inputClass} />
    </div>
  );
}

/** The popup of a chip: its fields, whether it follows the text or is pinned (with what that means), and remove. Not modal and without a focus trap: Escape or a click elsewhere closes it. */
export function ChipPopup({ chip, values, anchor, onValues, onLabel, onMode, onRemove, onClose }: Props) {
  const popup = useRef<HTMLDialogElement>(null);
  const first = useRef<HTMLInputElement>(null);
  const title = `${kindLabel[chip.kind]} aanpassen`;

  // Under the chip, and on a narrow screen as wide as the step (see the classes).
  useLayoutEffect(() => {
    const el = popup.current;
    const chipEl = anchor();
    if (!el || !chipEl) return;
    const room = (el.offsetParent as HTMLElement | null)?.clientWidth ?? 0;
    el.style.setProperty('--pop-left', `${Math.max(0, Math.min(chipEl.offsetLeft, room - el.offsetWidth))}px`);
    el.style.setProperty('--pop-top', `${chipEl.offsetTop + chipEl.offsetHeight + 12}px`);
    // The arrow points at the middle of the chip, kept off the rounded corners.
    const middle = chipEl.offsetLeft + chipEl.offsetWidth / 2 - el.offsetLeft;
    el.style.setProperty('--pop-arrow', `${Math.max(20, Math.min(middle, el.offsetWidth - 20))}px`);
  });

  useEffect(() => first.current?.focus(), []);

  useEffect(() => {
    const away = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!popup.current?.contains(target) && !anchor()?.contains(target)) onClose(false);
    };
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  });

  const keyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Escape' || e.nativeEvent.isComposing) return;
    e.preventDefault();
    e.stopPropagation();
    onClose(true);
  };

  const values_ = values as IngredientValues & OvenValues & TimerValues;
  const follows = chip.mode === 'auto';
  const canFollow = !!chip.anchor && !chip.lost;

  return (
    // The dialog is not interactive itself; the key handler only catches Escape from the fields inside.
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <dialog
      open
      ref={popup}
      aria-label={title}
      onKeyDown={keyDown}
      className="absolute top-(--pop-top) m-0 z-20 grid overflow-visible gap-3 rounded-xl border-3 border-ink bg-white p-3.5 font-bold text-ink shadow-hard max-sm:inset-x-0 max-sm:w-auto sm:right-auto sm:left-(--pop-left) sm:w-80"
    >
      {/* The arrow is two triangles: an ink one, and a white one 3px smaller whose base covers the popup's border. */}
      <span
        aria-hidden="true"
        className="absolute -top-3 left-(--pop-arrow) h-3 w-6 -translate-x-1/2 bg-ink [clip-path:polygon(50%_0,100%_100%,0_100%)]"
      />
      <span
        aria-hidden="true"
        className="absolute top-[-7.75px] left-(--pop-arrow) h-[7.75px] w-[15.5px] -translate-x-1/2 bg-white [clip-path:polygon(50%_0,100%_100%,0_100%)]"
      />
      {chip.kind === 'timer' && (
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="Minuten" value={values_.minutes} onValue={(minutes) => onValues({ minutes })} first={first} />
          <TextField label="Naam" value={chip.label ?? ''} onValue={onLabel} />
        </div>
      )}
      {chip.kind === 'oven' && <NumberField label="Graden" value={values_.degrees} onValue={(degrees) => onValues({ degrees })} first={first} />}
      {chip.kind === 'ingredient' && (
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-2">
          <TextField label="Hoeveelheid" value={values_.quantity} onValue={(quantity) => onValues({ quantity })} first={first} />
          <TextField label="Naam" value={values_.name} onValue={(name) => onValues({ name })} />
        </div>
      )}
      {canFollow ? (
        <>
          <fieldset className="m-0 grid min-w-0 grid-cols-2 border-0 p-0">
            <legend className="sr-only">Volgt dit de tekst</legend>
            {(
              [
                ['auto', 'Volgt tekst', <Link key="link" className="size-[1.1em]" />],
                ['manual', 'Vast', <Pin key="pin" className="size-[1.1em]" />],
              ] as const
            ).map(([mode, text, icon]) => (
              <button
                key={mode}
                type="button"
                aria-pressed={follows === (mode === 'auto')}
                onClick={() => onMode(mode)}
                className="flex min-h-10 cursor-pointer items-center justify-center gap-1.5 border-2 border-ink bg-white text-sm font-black hover:not-aria-pressed:bg-[color-mix(in_srgb,var(--color-ink)_5%,white)] first-of-type:rounded-l-lg last:-ml-0.5 last:rounded-r-lg aria-pressed:bg-ink aria-pressed:text-white"
              >
                {icon}
                {text}
              </button>
            ))}
          </fieldset>
          <p className="m-0 text-[0.8125rem] leading-snug font-bold text-muted">
            <b className="text-ink">Volgt tekst:</b> verandert mee met de tekst in de stap. <br />
            <b className="text-ink">Vast:</b> verandert niet meer, toont suggesties als de tekst wijzigt
          </p>
        </>
      ) : (
        <p className="m-0 text-[0.8125rem] leading-snug font-bold text-muted">
          <b className="text-ink">Vast:</b> deze chip hoort bij geen woorden in de stap, dus hij blijft zoals hij is.
        </p>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="flex min-h-9 cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 font-black text-red hover:underline"
      >
        <Trash className="size-[1.1em]" />
        {kindLabel[chip.kind]} verwijderen
      </button>
    </dialog>
  );
}
