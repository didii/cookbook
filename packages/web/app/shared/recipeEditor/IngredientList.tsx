import { useEffect, useRef, useState } from 'react';
import type { IngredientRow } from '~/lib/draft';
import { IngredientItem, type ItemHandle } from './IngredientItem';

type Props = {
  /** The rows to show; the last one is the empty row. */
  rows: IngredientRow[];
  /** Messages by row index. */
  errors?: Record<number, string>;
  /** Step numbers that use a row; filled in by the chips change. */
  usedIn?: (id: string) => number[];
  onType: (id: string, text: string) => void;
  onRemove: (id: string) => void;
  /** Move a row to a place in the list. */
  onMove: (id: string, to: number) => void;
};

const none: number[] = [];
const noErrors: Record<number, string> = {};

/** The ingredient list: one line per row, keyboard navigation between rows, move announcements, and the list as the form field `ingredients`. */
export function IngredientList({ rows, errors = noErrors, usedIn = () => none, onType, onRemove, onMove }: Props) {
  const items = useRef(new Map<string, ItemHandle>());
  // Work to do once the rows have rendered, such as focusing a row that did not exist yet.
  const afterRender = useRef<() => void>(undefined);
  // The row last moved and where it was, to announce where it ended up.
  const moved = useRef<{ id: string; from: number }>(undefined);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    afterRender.current?.();
    afterRender.current = undefined;
    const m = moved.current;
    moved.current = undefined;
    const to = m ? rows.findIndex((r) => r.id === m.id) : -1;
    if (m && to >= 0 && to !== m.from) setAnnouncement(`Ingrediënt '${rows[to].text.trim()}' staat nu op plaats ${to + 1} van ${rows.length - 1}`);
  }, [rows]);

  // After a refused submit, put focus on the first row in error so its message is read.
  useEffect(() => {
    const first = rows.findIndex((_, i) => errors[i]);
    if (first >= 0) items.current.get(rows[first].id)?.focusField('end');
    // Only when the errors change, not on every keystroke.
    // oxlint-disable-next-line react/exhaustive-deps
  }, [errors]);

  const focus = (id: string | undefined, caret: 'start' | 'end') => id && items.current.get(id)?.focusField(caret);
  const index = (id: string) => rows.findIndex((r) => r.id === id);

  const move = (id: string, direction: -1 | 1) => {
    moved.current = { id, from: index(id) };
    onMove(id, index(id) + direction);
  };
  const remove = (id: string, thenFocus: 'next' | 'previous') => {
    const i = index(id);
    const target = thenFocus === 'next' ? rows[i + 1] : (rows[i - 1] ?? rows[i + 1]);
    onRemove(id);
    afterRender.current = () => focus(target?.id, thenFocus === 'next' ? 'start' : 'end');
  };

  return (
    <div>
      <input type="hidden" name="ingredients" value={JSON.stringify(rows.map((r) => ({ text: r.text })))} />
      <ul className="m-0 grid list-none gap-1.5 p-0">
        {rows.map((row, i) => {
          const free = i === rows.length - 1;
          return (
            <IngredientItem
              key={row.id}
              ref={(handle) => {
                if (handle) items.current.set(row.id, handle);
                else items.current.delete(row.id);
              }}
              id={`ingredient-${row.id}`}
              label={`Ingrediënt ${i + 1}`}
              text={row.text}
              placeholder={free ? 'Bijvoorbeeld 250 g bloem' : undefined}
              free={free}
              canUp={i > 0}
              canDown={i < rows.length - 2}
              error={errors[i]}
              usedIn={usedIn(row.id)}
              onType={(text) => onType(row.id, text)}
              onRemove={() => remove(row.id, 'next')}
              onMove={(direction) => move(row.id, direction)}
              onStep={(direction) => focus(rows[i + direction]?.id, 'end')}
              onBackspaceEmpty={() => remove(row.id, 'previous')}
            />
          );
        })}
      </ul>
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
    </div>
  );
}
