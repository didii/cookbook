import { useRef, useState, type KeyboardEvent } from 'react';
import { cn } from '~app/shared/cn';
import { ChevronDown, ChevronUp, Cross, Plus, Trash } from '~app/shared/icons';
import { useAfterRender } from './useAfterRender';

type Props = {
  /** Accessible name of the button group. */
  label: string;
  /** Accessible name of the delete button. */
  deleteLabel: string;
  /** Accessible name of the insert button. */
  insertLabel?: string;
  canUp: boolean;
  canDown: boolean;
  /** Two small arrows above each other next to the delete button, or all three buttons in a row. */
  stacked?: boolean;
  /** A bin instead of a cross on the delete button. */
  trash?: boolean;
  /** Shown but inert: the row has nothing to act on yet. */
  disabled?: boolean;
  className?: string;
  /** Move one place up (-1) or down (1). */
  onMove: (direction: -1 | 1) => void;
  onDelete: () => void;
  /** When given, a first button that inserts a row above this one. */
  onInsert?: () => void;
};

const iconClass = 'size-[1.05em]';
const icons = {
  insert: <Plus className={iconClass} />,
  up: <ChevronUp className={iconClass} />,
  down: <ChevronDown className={iconClass} />,
  cross: <Cross className={iconClass} />,
  trash: <Trash className={iconClass} />,
};

const buttonClass =
  'grid cursor-pointer place-items-center text-muted not-disabled:hover:bg-ink/10 not-disabled:hover:text-ink disabled:cursor-default disabled:opacity-30';

/** The (insert,) up, down and delete buttons of a row as one toolbar: a single Tab stop, with the arrow keys (and Home and End) moving between the buttons. After a move, focus stays on the button that was used. */
export function RowToolbar({
  label,
  deleteLabel,
  insertLabel,
  canUp,
  canDown,
  stacked,
  trash,
  disabled,
  className,
  onMove,
  onDelete,
  onInsert,
}: Props) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const afterRender = useAfterRender();
  // The one button that is in the Tab order: the last one used, or the first enabled one when that is disabled.
  const actions = onInsert ? (['insert', 'up', 'down', 'delete'] as const) : (['up', 'down', 'delete'] as const);
  const enabled = disabled ? actions.map(() => false) : actions.map((a) => (a === 'up' ? canUp : a === 'down' ? canDown : true));
  const [remembered, setRemembered] = useState(0);
  const stop = enabled[remembered] ? remembered : enabled.indexOf(true);

  const focusButton = (i: number) => {
    setRemembered(i);
    buttons.current[i]?.focus();
  };
  const keyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const open = actions.map((_, i) => i).filter((i) => enabled[i]);
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
    // The move may disable the button; then the first enabled one gets focus.
    // Read the buttons as they are after the render: `enabled` here is as of the render that was pressed.
    afterRender(() => (buttons.current[button]?.disabled ? buttons.current.find((b) => b && !b.disabled) : buttons.current[button])?.focus());
    onMove(direction);
  };

  return (
    // The group itself is not focusable: its buttons are, with a roving tabindex.
    // oxlint-disable-next-line jsx-a11y/interactive-supports-focus
    <div
      role="toolbar"
      data-testid="RowToolbar-toolbar"
      aria-label={label}
      onKeyDown={keyDown}
      className={cn(
        'items-center overflow-hidden rounded-[0.55rem] bg-ink/7',
        stacked ? 'grid grid-cols-[1.75rem_2rem] grid-rows-[1.625rem_1.625rem] justify-items-center' : 'flex',
        className,
      )}
    >
      {actions.map((action, i) => (
        <button
          key={action}
          ref={(el) => {
            buttons.current[i] = el;
          }}
          type="button"
          data-testid="RowToolbar-button"
          aria-label={{ insert: insertLabel, up: 'Omhoog', down: 'Omlaag', delete: deleteLabel }[action]}
          disabled={!enabled[i]}
          tabIndex={i === stop ? 0 : -1}
          onFocus={() => setRemembered(i)}
          onClick={{ insert: onInsert, delete: onDelete, up: () => press(i, -1), down: () => press(i, 1) }[action]}
          className={cn(
            buttonClass,
            action === 'delete' ? 'border-l-2 border-ink/10 hover:not-disabled:bg-red/10 hover:not-disabled:text-red' : '',
            action === 'delete' && (stacked ? 'col-start-2 row-span-2 row-start-1 size-full ' : 'size-9'),
            (action === 'up' || action === 'down') && (stacked ? 'h-6.5 w-7 text-[0.95rem]' : 'size-9'),
            action === 'insert' && 'size-9',
            stacked && action === 'down' && 'row-start-2',
          )}
        >
          {action === 'delete' ? icons[trash ? 'trash' : 'cross'] : icons[action]}
        </button>
      ))}
    </div>
  );
}
