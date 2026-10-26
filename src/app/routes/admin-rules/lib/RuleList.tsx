import { useEffect, useId, useRef, type ComponentProps, type ReactNode } from 'react';
import { Announcement } from '~app/shared/components';
import type { ItemHandle } from '~app/shared/ItemHandle';
import { useReorder } from '~app/shared/useReorder';
import { ensureFree, type RuleItem } from './rows';
import { RuleRow } from './RuleRow';

interface RuleListProps<T extends RuleItem> extends Omit<ComponentProps<'ul'>, 'onChange'> {
  /** The rows to show; the last one is the empty row. */
  rows: T[];
  /** Name of a row for assistive technology: "Eenheid" gives "Eenheid 1", "Eenheid 2". */
  noun: string;
  /** A new empty row, with an id no other row has. */
  blank: () => T;
  /** Words to suggest in the fields. */
  suggestions?: string[];
  /** Messages by row index. */
  errors?: Record<number, string>;
  /** Put focus on the first row in error when the errors change. */
  focusError?: boolean;
  /** The cells a row has after its field. */
  extra?: (row: T, label: string, change: (patch: Partial<T>) => void) => ReactNode;
  /** The rows after a change; the list always ends in an empty row. */
  onChange: (rows: T[]) => void;
}

/** Space between rows (Tailwind gap-1.5), needed to shift rows aside while one is dragged. */
const gap = 6;
const noErrors: Record<number, string> = {};

/** A list of rows with the keyboard behaviour of the ingredient list: navigation, moving, removing, an empty row at the end and move announcements. It holds no rows of its own. */
export function RuleList<T extends RuleItem>({
  rows,
  noun,
  blank,
  suggestions,
  errors = noErrors,
  focusError,
  extra,
  onChange,
  ...props
}: RuleListProps<T>) {
  const base = useId();
  const items = useRef(new Map<string, ItemHandle>());
  // Work to do once the rows have rendered, such as focusing a row that did not exist yet.
  const afterRender = useRef<() => void>(undefined);
  const set = (next: T[]) => onChange(ensureFree(next, blank));
  const reorder = useReorder({
    ids: rows.slice(0, -1).map((r) => r.id),
    gap,
    rectOf: (id) => items.current.get(id)?.rect(),
    announce: (id, to) => `${noun} '${rows[to].text.trim()}' staat nu op plaats ${to + 1} van ${rows.length - 1}`,
    onMove: (id, to) => {
      const from = rows.findIndex((r) => r.id === id);
      const next = [...rows];
      next.splice(to, 0, ...next.splice(from, 1));
      set(next);
    },
  });

  useEffect(() => {
    afterRender.current?.();
    afterRender.current = undefined;
  }, [rows]);

  // After a refused save, put focus on the first row in error so its message is read.
  useEffect(() => {
    const first = rows.findIndex((_, i) => errors[i]);
    if (focusError && first >= 0) items.current.get(rows[first].id)?.focusField('end');
    // Only when the errors change, not on every keystroke.
    // oxlint-disable-next-line react/exhaustive-deps
  }, [errors]);

  const focus = (id: string | undefined, caret: 'start' | 'end') => id && items.current.get(id)?.focusField(caret);

  const remove = (id: string, thenFocus: 'next' | 'previous') => {
    const i = rows.findIndex((r) => r.id === id);
    const target = thenFocus === 'next' ? rows[i + 1] : (rows[i - 1] ?? rows[i + 1]);
    set(rows.filter((r) => r.id !== id));
    afterRender.current = () => focus(target?.id, thenFocus === 'next' ? 'start' : 'end');
  };
  const change = (id: string, patch: Partial<T>) => set(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  return (
    <div>
      <ul {...props} className="m-0 grid list-none gap-1.5 p-0">
        {rows.map((row, i) => {
          const free = i === rows.length - 1;
          return (
            <RuleRow
              key={row.id}
              handleRef={(handle) => {
                if (handle) items.current.set(row.id, handle);
                else items.current.delete(row.id);
              }}
              rowId={`${base}-${row.id}`}
              label={`${noun} ${i + 1}`}
              text={row.text}
              free={free}
              canUp={!free && i > 0}
              canDown={i < rows.length - 2}
              error={errors[i]}
              suggestions={suggestions}
              onType={(text) => change(row.id, { text } as Partial<T>)}
              onRemove={() => remove(row.id, 'next')}
              onMove={(direction) => reorder.move(row.id, direction)}
              onStep={(direction) => focus(rows[i + direction]?.id, 'end')}
              onBackspaceEmpty={() => remove(row.id, 'previous')}
              gripProps={free ? {} : reorder.gripProps(i)}
              style={reorder.styleOf(i)}
              className={row.minutes === undefined ? undefined : durationRow}
            >
              {extra?.(row, `${noun} ${i + 1}`, (patch) => change(row.id, patch))}
            </RuleRow>
          );
        })}
      </ul>
      <Announcement text={reorder.announcement} />
    </div>
  );
}

/** A duration row has the minutes and "Vast" after the word; "Vast" moves under the word below 40rem. */
const durationRow = 'grid-cols-[auto_minmax(0,1fr)_5.75rem_auto] gap-x-1.5 sm:grid-cols-[auto_minmax(0,1fr)_5.75rem_auto_auto]';
