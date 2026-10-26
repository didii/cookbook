import { Combobox } from '@base-ui/react/combobox';
import { useImperativeHandle, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode, type Ref } from 'react';
import { cn } from '~app/shared/cn';
import { Cross } from '~app/shared/icons';
import type { ItemHandle } from '~app/shared/ItemHandle';
import { RowGrip } from '~app/shared/RowGrip';
import { useAfterRender } from '~app/shared/useAfterRender';

interface RuleRowProps extends ComponentProps<'li'> {
  handleRef?: Ref<ItemHandle>;
  /** Accessible name of the field and base of the id of its error. */
  label: string;
  rowId: string;
  text: string;
  placeholder?: string;
  /** The empty row at the end: it has no cross and cannot move. */
  free: boolean;
  canUp: boolean;
  canDown: boolean;
  error?: string;
  /** Words to suggest while typing; free text stays allowed. Without it the field is a plain field. */
  suggestions?: string[];
  onType: (text: string) => void;
  onRemove: () => void;
  /** Move one place up (-1) or down (1). */
  onMove: (direction: -1 | 1) => void;
  /** Ask for focus on the row below (1) or above (-1). */
  onStep: (direction: -1 | 1) => void;
  /** Backspace was pressed in an empty field. */
  onBackspaceEmpty: () => void;
  /** Pointer handlers for the grip. */
  gripProps: ComponentProps<'span'>;
  /** More cells after the field (the minutes and "Vast" of a duration). */
  children?: ReactNode;
}

const fieldClass =
  'block min-h-10 w-full rounded-[0.625rem] border-3 border-ink bg-white px-2.5 text-base leading-[1.4] font-bold text-ink hover:not-focus:bg-ink/5 placeholder:text-ink/50 focus:shadow-focus focus:outline-transparent aria-invalid:border-red';

/** One compact row of a rules list: grip, one field, optional extra cells and a cross. Keys as in the ingredient list. */
export function RuleRow({
  handleRef,
  label,
  rowId,
  text,
  placeholder,
  free,
  canUp,
  canDown,
  error,
  suggestions,
  onType,
  onRemove,
  onMove,
  onStep,
  onBackspaceEmpty,
  gripProps,
  className,
  children,
  ...props
}: RuleRowProps) {
  const input = useRef<HTMLInputElement>(null);
  const item = useRef<HTMLLIElement>(null);
  const afterRender = useAfterRender();
  const [open, setOpen] = useState(false);
  const highlighted = useRef(false);

  useImperativeHandle(handleRef, () => ({
    rect: () => item.current?.getBoundingClientRect(),
    focusField: (caret) => {
      const el = input.current;
      if (!el) return;
      el.focus();
      const at = caret === 'end' ? el.value.length : 0;
      el.setSelectionRange(at, at);
    },
  }));

  // Ignores letter case and accents.
  const { contains } = Combobox.useFilter({ sensitivity: 'base' });
  const options = (suggestions ?? []).filter((word) => contains(word, text.trim()));
  const listening = open && options.length > 0;

  const keyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;
    const vertical = e.key === 'ArrowDown' || e.key === 'ArrowUp';
    if (e.altKey && vertical) {
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
      // Enter takes the suggestion that is picked; the open list otherwise leaves it to the row.
      if (listening && highlighted.current) return;
      e.preventDefault();
      onStep(1);
    } else if (vertical) {
      // The open suggestions use the arrow keys; the row takes them when the list is closed.
      if (listening) return;
      e.preventDefault();
      onStep(e.key === 'ArrowDown' ? 1 : -1);
    } else if (e.key === 'Backspace' && !text && !free) {
      e.preventDefault();
      onBackspaceEmpty();
    }
  };

  const errorId = `${rowId}-error`;
  const fieldProps = {
    'aria-label': label,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? errorId : undefined,
    autoComplete: 'off',
    enterKeyHint: 'next',
    autoCapitalize: 'none',
    spellCheck: false,
    onKeyDown: keyDown,
    className: fieldClass,
  } as const;

  return (
    <li {...props} ref={item} className={cn('relative grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-0.5 gap-y-1', className)}>
      <RowGrip {...gripProps} className={cn('min-h-10 w-5', free && 'cursor-default opacity-40')} />
      {suggestions ? (
        <Combobox.Root
          items={options}
          filter={null}
          value={null}
          onValueChange={(picked) => picked && onType(picked)}
          inputValue={text}
          // The list clears the field when it closes with nothing picked; the typed word stays.
          onInputValueChange={(v, details) => details.reason !== 'input-clear' && onType(v)}
          open={open}
          onOpenChange={setOpen}
          onItemHighlighted={(value) => (highlighted.current = value !== undefined)}
        >
          <Combobox.Input
            {...fieldProps}
            ref={input}
            data-testid="RuleRow-field"
            placeholder={placeholder}
            onFocus={() => text === '' && setOpen(true)}
          />
          <Combobox.Portal>
            <Combobox.Positioner sideOffset={4} className="z-10 w-(--anchor-width)">
              <Combobox.Popup className="max-h-44 overflow-y-auto rounded-[0.625rem] border-3 border-ink bg-white p-1 shadow-hard-sm empty:hidden">
                <Combobox.List>
                  {(word: string) => (
                    <Combobox.Item
                      key={word}
                      value={word}
                      data-testid="RuleRow-option"
                      className="cursor-pointer rounded-md px-2.5 py-1 font-bold data-highlighted:bg-blu data-highlighted:text-white"
                    >
                      {word}
                    </Combobox.Item>
                  )}
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>
      ) : (
        <input
          {...fieldProps}
          ref={input}
          type="text"
          data-testid="RuleRow-field"
          value={text}
          placeholder={placeholder}
          onChange={(e) => onType(e.target.value)}
        />
      )}
      {children}
      <button
        type="button"
        data-testid="RuleRow-remove"
        aria-label={`${label} verwijderen`}
        onClick={onRemove}
        className={cn(
          'grid size-10 cursor-pointer place-items-center rounded-[0.625rem] text-muted hover:bg-red/12 hover:text-red',
          free && 'invisible',
        )}
      >
        <Cross className="size-5" />
      </button>
      {error && (
        <p id={errorId} data-testid="RuleRow-error" className="col-span-full col-start-2 text-[0.9375rem] font-extrabold text-red">
          {error}
        </p>
      )}
    </li>
  );
}
