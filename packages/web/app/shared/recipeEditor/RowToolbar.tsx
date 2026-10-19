import { useRef, useState, type KeyboardEvent } from 'react';
import { cn } from '~/shared/cn';
import { Cross, Down, Trash, Up } from '~/shared/icons';
import { useAfterRender } from './useAfterRender';

type Props = {
  /** Accessible name of the button group. */
  label: string;
  /** Accessible name of the delete button. */
  deleteLabel: string;
  canUp: boolean;
  canDown: boolean;
  /** Two small arrows above each other next to the delete button, or all three buttons in a row. */
  stacked?: boolean;
  /** A bin instead of a cross on the delete button. */
  trash?: boolean;
  className?: string;
  /** Move one place up (-1) or down (1). */
  onMove: (direction: -1 | 1) => void;
  onDelete: () => void;
};

const iconClass = 'size-[1.05em]';
const icons = {
  up: <Up className={iconClass} />,
  down: <Down className={iconClass} />,
  cross: <Cross className={iconClass} />,
  trash: <Trash className={iconClass} />,
};

const buttonClass =
  'grid cursor-pointer place-items-center rounded-md text-muted not-disabled:hover:bg-ink/10 not-disabled:hover:text-ink disabled:cursor-default disabled:opacity-30';

/** The up, down and delete buttons of a row as one toolbar: a single Tab stop, with the arrow keys (and Home and End) moving between the buttons. After a move, focus stays on the button that was used. */
export function RowToolbar({ label, deleteLabel, canUp, canDown, stacked, trash, className, onMove, onDelete }: Props) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const afterRender = useAfterRender();
  // The one button that is in the Tab order: the last one used, or the first enabled one when that is disabled.
  const enabled = [canUp, canDown, true];
  const [remembered, setRemembered] = useState(0);
  const stop = enabled[remembered] ? remembered : enabled.indexOf(true);

  const focusButton = (i: number) => {
    setRemembered(i);
    buttons.current[i]?.focus();
  };
  const keyDown = (e: KeyboardEvent<HTMLDivElement>) => {
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
      aria-label={label}
      onKeyDown={keyDown}
      className={cn(
        'items-center rounded-[0.55rem] bg-ink/7 px-0.5',
        stacked ? 'grid grid-cols-[1.75rem_2rem] grid-rows-[1.625rem_1.625rem] justify-items-center' : 'flex',
        className,
      )}
    >
      {(['up', 'down', 'delete'] as const).map((action, i) => (
        <button
          key={action}
          ref={(el) => {
            buttons.current[i] = el;
          }}
          type="button"
          aria-label={i === 2 ? deleteLabel : ['Omhoog', 'Omlaag'][i]}
          disabled={!enabled[i]}
          tabIndex={i === stop ? 0 : -1}
          onFocus={() => setRemembered(i)}
          onClick={i === 2 ? onDelete : () => press(i, i === 0 ? -1 : 1)}
          className={cn(
            buttonClass,
            i < 2 && (stacked ? 'h-[1.625rem] w-7 text-[0.95rem]' : 'size-9'),
            i === 2 && 'ml-0.5 rounded-l-none border-l-2 border-ink/10 hover:not-disabled:bg-red/10 hover:not-disabled:text-red',
            i === 2 && (stacked ? 'col-start-2 row-span-2 row-start-1 size-8' : 'size-9'),
            stacked && i === 1 && 'row-start-2',
          )}
        >
          {i === 2 ? icons[trash ? 'trash' : 'cross'] : icons[action as 'up' | 'down']}
        </button>
      ))}
    </div>
  );
}
