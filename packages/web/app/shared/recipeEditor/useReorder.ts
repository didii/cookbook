import { useEffect, useRef, useState, type ComponentProps, type CSSProperties, type PointerEvent } from 'react';
import { dropIndex } from './dropIndex';

type Options = {
  /** The ids of the rows that can be moved, in order. */
  ids: string[];
  /** Space between rows, needed to shift rows aside while one is dragged. */
  gap: number;
  /** Where a row is on the page. */
  rectOf: (id: string) => DOMRect | undefined;
  /** What to tell assistive technology once a row has moved to place `to` (counting from 0). */
  announce: (id: string, to: number) => string;
  /** Move a row to a place in the list. */
  onMove: (id: string, to: number) => void;
};

type Drag = { id: string; from: number; to: number; offset: number; startY: number; rects: DOMRect[] };

/** Moving rows by buttons and by dragging a grip, with the announcement of where a row ended up. */
export function useReorder({ ids, gap, rectOf, announce, onMove }: Options) {
  // The row last moved and where it was, to announce where it ended up.
  const moved = useRef<{ id: string; from: number }>(undefined);
  const [announcement, setAnnouncement] = useState('');
  const [drag, setDrag] = useState<Drag>();

  // Escape puts a dragged row back.
  const dragging = !!drag;
  useEffect(() => {
    if (!dragging) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrag(undefined);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [dragging]);

  // When the order changed: announce the move that caused it.
  const order = ids.join('|');
  useEffect(() => {
    const m = moved.current;
    moved.current = undefined;
    const to = m ? ids.indexOf(m.id) : -1;
    if (m && to >= 0 && to !== m.from) setAnnouncement(announce(m.id, to));
    // Only a new order can be a move; `ids` and `announce` are read as of that render.
    // oxlint-disable-next-line react/exhaustive-deps
  }, [order]);

  // Runs a move and announces where the row ended up. A move that changes nothing is not announced, and does not leave the request behind for a later render.
  const announceMove = (id: string, from: number, run: () => void) => {
    moved.current = { id, from };
    run();
    setTimeout(() => (moved.current = undefined));
  };

  const startDrag = (e: PointerEvent<HTMLElement>, from: number) => {
    // The grip is for mouse and pen; touch scrolls the page and reorders with the buttons.
    if (e.pointerType === 'touch' || e.button !== 0) return;
    const rects = ids.map(rectOf);
    if (rects.some((r) => !r)) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ id: ids[from], from, to: from, offset: 0, startY: e.clientY, rects: rects as DOMRect[] });
  };
  const dragTo = (e: PointerEvent<HTMLElement>) => {
    if (!drag) return;
    const offset = e.clientY - drag.startY;
    const mids = drag.rects.map((r) => r.top + r.height / 2);
    setDrag({ ...drag, offset, to: dropIndex(mids, drag.from, mids[drag.from] + offset) });
  };
  const drop = () => {
    if (drag && drag.to !== drag.from) {
      announceMove(drag.id, drag.from, () => onMove(drag.id, drag.to));
    }
    setDrag(undefined);
  };

  return {
    announcement,
    /** Move a row one place up (-1) or down (1). */
    move: (id: string, direction: -1 | 1) => {
      const from = ids.indexOf(id);
      announceMove(id, from, () => onMove(id, from + direction));
    },
    /** The pointer handlers for the grip of the row at place `i`. */
    gripProps: (i: number): ComponentProps<'span'> => ({
      onPointerDown: (e) => startDrag(e, i),
      onPointerMove: dragTo,
      onPointerUp: drop,
      onPointerCancel: () => setDrag(undefined),
    }),
    /** Where the row at place `i` sits while another is dragged: the dragged one follows the pointer, the ones it passes make room. */
    styleOf: (i: number): CSSProperties | undefined => {
      if (!drag) return undefined;
      if (i === drag.from) return { transform: `translateY(${drag.offset}px)`, zIndex: 1 };
      const room = drag.rects[drag.from].height + gap;
      const shift = drag.from < i && i <= drag.to ? -room : drag.to <= i && i < drag.from ? room : 0;
      return { transform: `translateY(${shift}px)`, transition: 'transform 120ms' };
    },
  };
}
