import { useImperativeHandle, useLayoutEffect, useRef, type ComponentProps, type CSSProperties, type KeyboardEvent, type Ref } from 'react';
import { parseIngredient } from '~/lib/ingredients';
import { cn } from '~/shared/cn';
import type { ItemHandle } from './ItemHandle';
import { RowGrip } from './RowGrip';
import { RowToolbar } from './RowToolbar';
import { useAfterRender } from './useAfterRender';

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

const field = 'col-start-1 row-start-1 h-13 rounded-[0.625rem] border-3 px-3 text-lg leading-[1.4] font-bold';
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

  const afterRender = useAfterRender();

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
      const selection: [number, number] = [e.currentTarget.selectionStart ?? 0, e.currentTarget.selectionEnd ?? 0];
      afterRender(() => {
        input.current?.focus();
        input.current?.setSelectionRange(...selection);
      });
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
      <RowGrip {...gripProps} className={cn('col-start-1 row-start-1 min-h-11 w-6', free && 'invisible')} />
      <RowToolbar
        label={toolbarLabel}
        deleteLabel="Verwijder"
        canUp={canUp}
        canDown={canDown}
        stacked
        className={cn('col-start-2 row-start-1 mr-1', free && 'invisible')}
        onMove={onMove}
        onDelete={onRemove}
      />
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
