import { useEffect, useRef } from 'react';
import type { IngredientLine } from '~/lib/draft';
import { Announcement } from './Announcement';
import { IngredientItem } from './IngredientItem';
import type { ItemHandle } from './ItemHandle';
import { useReorder } from './useReorder';

type Props = {
  /** The rows to show; the last one is the empty row. */
  rows: IngredientLine[];
  /** Messages by row index. */
  errors?: Record<number, string>;
  /** Step numbers that use a row; filled in by the chips change. */
  usedIn?: (id: string) => number[];
  onType: (id: string, text: string) => void;
  onRemove: (id: string) => void;
  /** Move a row to a place in the list. */
  onMove: (id: string, to: number) => void;
};

/** Space between rows (Tailwind gap-1.5), needed to shift rows aside while one is dragged. */
const gap = 6;

const Kbd = ({ children }: { children: string }) => (
  <kbd className="rounded-[0.3rem] border-2 border-ink/45 bg-white px-1 font-[inherit] text-[0.8rem] font-extrabold">{children}</kbd>
);

const none: number[] = [];
const noErrors: Record<number, string> = {};

/** The ingredient list: one line per row, keyboard navigation between rows, move announcements, and the list as the form field `ingredients`. */
export function IngredientList({ rows, errors = noErrors, usedIn = () => none, onType, onRemove, onMove }: Props) {
  const items = useRef(new Map<string, ItemHandle>());
  // Work to do once the rows have rendered, such as focusing a row that did not exist yet.
  const afterRender = useRef<() => void>(undefined);
  const reorder = useReorder({
    ids: rows.slice(0, -1).map((r) => r.id),
    gap,
    rectOf: (id) => items.current.get(id)?.rect(),
    announce: (id, to) => `Ingrediënt '${rows[to].text.trim()}' staat nu op plaats ${to + 1} van ${rows.length - 1}`,
    onMove,
  });

  useEffect(() => {
    afterRender.current?.();
    afterRender.current = undefined;
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
              toolbarLabel={`Acties voor ingrediënt ${i + 1}`}
              text={row.text}
              placeholder={free ? '250 g bloem' : undefined}
              free={free}
              canUp={!free && i > 0}
              canDown={i < rows.length - 2}
              error={errors[i]}
              usedIn={usedIn(row.id)}
              onType={(text) => onType(row.id, text)}
              onRemove={() => remove(row.id, 'next')}
              onMove={(direction) => reorder.move(row.id, direction)}
              onStep={(direction) => focus(rows[i + direction]?.id, 'end')}
              onBackspaceEmpty={() => remove(row.id, 'previous')}
              gripProps={free ? {} : reorder.gripProps(i)}
              style={reorder.styleOf(i)}
            />
          );
        })}
      </ul>
      {/* Keyboard hints mean nothing on a touch screen. */}
      <p className="mt-2.5 text-[0.9rem] font-bold text-muted [@media(hover:none)]:hidden">
        <p>
          <Kbd>Enter</Kbd> voor de volgende regel
        </p>
        <p>
          <Kbd>Alt+Up</Kbd> of <Kbd>Alt+Down</Kbd> om te verplaatsen
        </p>
      </p>
      <Announcement text={reorder.announcement} />
    </div>
  );
}
