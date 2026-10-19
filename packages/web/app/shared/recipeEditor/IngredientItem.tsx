import { useImperativeHandle, useLayoutEffect, useRef, useState, type ComponentProps, type CSSProperties, type KeyboardEvent, type Ref } from 'react';
import { parseIngredient } from '~/lib/ingredients';
import { cn } from '~/shared/cn';

/** What the list can ask of a row it renders. */
export type ItemHandle = {
  /** Focus the field with the caret at the start or end of its text. */
  focusField: (caret: 'start' | 'end') => void;
  /** Where the row is on the page, for dragging. */
  rect: () => DOMRect | undefined;
};

type Props = {
  ref?: Ref<ItemHandle>;
  /** Accessible name of the field and the base of the id of its error. */
  label: string;
  /** Accessible name of the row's button group. */
  toolbarLabel: string;
  id: string;
  text: string;
  placeholder?: string;
  /** The empty row at the end: it has no buttons yet. */
  free: boolean;
  canUp: boolean;
  canDown: boolean;
  error?: string;
  /** Step numbers that use this ingredient, for the "Gebruikt in stap" line. */
  usedIn: number[];
  onType: (text: string) => void;
  onRemove: () => void;
  /** Move one place up (-1) or down (1). */
  onMove: (direction: -1 | 1) => void;
  /** Ask for focus on the row below (1) or above (-1). */
  onStep: (direction: -1 | 1) => void;
  /** Pointer handlers for the grip, and the style the row gets while it is dragged or shifted aside. */
  gripProps: ComponentProps<'span'>;
  style?: CSSProperties;
  /** Backspace was pressed in an empty field. */
  onBackspaceEmpty: () => void;
};

const icon = {
  viewBox: '0 0 24 24',
  'aria-hidden': true,
  className: 'size-[1.05em] fill-none stroke-current stroke-2 [stroke-linecap:round] [stroke-linejoin:round]',
};
const grip = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 fill-current">
    {[8, 16].flatMap((x) => [6, 12, 18].map((y) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.6" />))}
  </svg>
);
const icons = {
  up: (
    <svg {...icon}>
      <path d="M6 15l6-6 6 6" />
    </svg>
  ),
  down: (
    <svg {...icon}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
  delete: (
    <svg {...icon}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
};

const actions = ['up', 'down', 'delete'] as const;

const field = 'col-start-1 row-start-1 h-13 rounded-[0.625rem] border-3 px-3 text-lg leading-[1.4] font-bold';
const buttonClass =
  'grid cursor-pointer place-items-center rounded-md text-muted not-disabled:hover:bg-ink/10 not-disabled:hover:text-ink disabled:cursor-default disabled:opacity-30';

/** One ingredient line: the quantity is painted blue by a mirror layer under the real (transparent-text) input, so editing stays native. */
export function IngredientItem({
  ref,
  label,
  toolbarLabel,
  id,
  text,
  placeholder,
  free,
  canUp,
  canDown,
  error,
  usedIn,
  onType,
  onRemove,
  onMove,
  onStep,
  onBackspaceEmpty,
  gripProps,
  style,
}: Props) {
  const input = useRef<HTMLInputElement>(null);
  const mirror = useRef<HTMLDivElement>(null);
  const item = useRef<HTMLLIElement>(null);
  const syncScroll = () => {
    if (mirror.current && input.current) mirror.current.scrollLeft = input.current.scrollLeft;
  };
  // The text changed: keep the mirror scrolled where the input is.
  useLayoutEffect(syncScroll, [text]);

  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  // The one button of the toolbar that is in the Tab order: the last one used, or the first enabled one when that is disabled.
  const enabled = [canUp, canDown, true];
  const [remembered, setRemembered] = useState(0);
  const stop = enabled[remembered] ? remembered : enabled.indexOf(true);
  // What to focus once a move has re-rendered the row: the field with its selection, or a button.
  const refocus = useRef<{ field: [number, number] } | { button: number }>(undefined);
  useLayoutEffect(() => {
    const target = refocus.current;
    refocus.current = undefined;
    if (!target) return;
    if ('field' in target) {
      input.current?.focus();
      input.current?.setSelectionRange(...target.field);
    } else buttons.current[enabled[target.button] ? target.button : enabled.indexOf(true)]?.focus();
  });

  const focusButton = (i: number) => {
    setRemembered(i);
    buttons.current[i]?.focus();
  };
  const toolbarKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const open = [0, 1, 2].filter((i) => enabled[i]);
    const at = open.indexOf(stop);
    const next = {
      ArrowRight: open[(at + 1) % open.length],
      ArrowLeft: open[(at + open.length - 1) % open.length],
      Home: open[0],
      End: open[open.length - 1],
    }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    focusButton(next);
  };
  const press = (button: number, direction: -1 | 1) => {
    refocus.current = { button };
    onMove(direction);
  };

  useImperativeHandle(ref, () => ({
    rect: () => item.current?.getBoundingClientRect(),
    focusField: (caret) => {
      const el = input.current;
      if (!el) return;
      el.focus();
      const at = caret === 'end' ? el.value.length : 0;
      el.setSelectionRange(at, at);
    },
  }));

  const keyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.altKey && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault();
      const direction = e.key === 'ArrowDown' ? 1 : -1;
      if (!(direction === 1 ? canDown : canUp)) return;
      refocus.current = { field: [e.currentTarget.selectionStart ?? 0, e.currentTarget.selectionEnd ?? 0] };
      onMove(direction);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      onStep(1);
    } else if (!e.altKey && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault();
      onStep(e.key === 'ArrowDown' ? 1 : -1);
    } else if (e.key === 'Backspace' && !text && !free) {
      e.preventDefault();
      onBackspaceEmpty();
    }
  };

  const quantity = parseIngredient(text).quantityText;
  const at = quantity ? text.indexOf(quantity) : -1;
  const errorId = `${id}-error`;

  return (
    <li ref={item} style={style} className="relative grid grid-cols-[auto_auto_minmax(0,1fr)] items-center gap-x-1">
      <span
        aria-hidden="true"
        {...gripProps}
        className={cn(
          'col-start-1 row-start-1 grid min-h-11 w-6 cursor-grab touch-none place-items-center select-none text-ink/40 [@media(hover:none)]:hidden',
          free && 'invisible',
        )}
      >
        {grip}
      </span>
      {/* The group itself is not focusable: its buttons are, with a roving tabindex. */}
      {/* oxlint-disable-next-line jsx-a11y/interactive-supports-focus */}
      <div
        role="toolbar"
        aria-label={toolbarLabel}
        onKeyDown={toolbarKeyDown}
        className={cn(
          'col-start-2 row-start-1 mr-1 grid grid-cols-[1.75rem_2rem] grid-rows-[1.625rem_1.625rem] items-center justify-items-center rounded-[0.55rem] bg-ink/7 px-0.5',
          free && 'invisible',
        )}
      >
        {actions.map((action, i) => (
          <button
            key={action}
            ref={(el) => {
              buttons.current[i] = el;
            }}
            type="button"
            aria-label={['Omhoog', 'Omlaag', 'Verwijder'][i]}
            disabled={!enabled[i]}
            tabIndex={i === stop ? 0 : -1}
            onFocus={() => setRemembered(i)}
            onClick={i === 2 ? onRemove : () => press(i, i === 0 ? -1 : 1)}
            className={cn(
              buttonClass,
              i < 2
                ? 'h-[1.625rem] w-7 text-[0.95rem]'
                : 'row-span-2 ml-0.5 size-8 rounded-l-none border-l-2 border-ink/10 hover:not-disabled:bg-red/10 hover:not-disabled:text-red',
              i === 1 && 'row-start-2',
              i === 2 && 'col-start-2 row-start-1',
            )}
          >
            {icons[action]}
          </button>
        ))}
      </div>
      <div className="col-start-3 row-start-1 grid">
        <div aria-hidden="true" className={cn(field, 'rounded-[0.625rem] bg-white border-transparent')} />
        <div ref={mirror} aria-hidden="true" className={cn(field, 'pointer-events-none flex items-center overflow-hidden border-transparent')}>
          <span className="shrink-0 whitespace-pre text-ink">
            {at < 0 ? (
              text
            ) : (
              <>
                {text.slice(0, at)}
                <b className="font-[inherit] text-blu">{quantity}</b>
                {text.slice(at + quantity.length)}
              </>
            )}
          </span>
        </div>
        <input
          ref={input}
          type="text"
          value={text}
          placeholder={placeholder}
          aria-label={label}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          autoComplete="off"
          enterKeyHint="next"
          onChange={(e) => onType(e.target.value)}
          onScroll={syncScroll}
          onKeyDown={keyDown}
          className={cn(
            field,
            'w-full border-ink bg-transparent text-transparent caret-ink placeholder:text-ink/50 focus:border-blu focus:outline-none aria-invalid:border-red',
          )}
        />
      </div>
      {(error || usedIn.length > 0) && (
        <div className="col-start-3 row-start-2">
          {error && (
            <p id={errorId} className="mt-1 font-bold text-red">
              {error}
            </p>
          )}
          {usedIn.length > 0 && <p className="mt-0.5 ml-1 text-[0.8125rem] font-bold text-muted">Gebruikt in stap {usedIn.join(', ')}</p>}
        </div>
      )}
    </li>
  );
}
