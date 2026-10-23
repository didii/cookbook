import { useImperativeHandle, useRef, useState, type ComponentProps, type CSSProperties, type KeyboardEvent, type Ref } from 'react';
import { useAfterRender } from '~app/shared/useAfterRender';
import type { Context } from './chips';
import type { StepDraft } from './draft';
import type { ItemHandle } from './ItemHandle';
import { RowGrip } from './RowGrip';
import { RowToolbar } from './RowToolbar';
import { StepChips } from './StepChips';
import { StepText, type Mark } from './StepText';
import type { TextEdit } from './textEdit';

type Props = {
  ref?: Ref<ItemHandle>;
  /** The step's number, counting from 1. */
  number: number;
  step: StepDraft;
  /** What the step's chips are read against. */
  context: Context;
  canUp: boolean;
  canDown: boolean;
  onType: (text: string) => void;
  /** Changes the step's chips with a function of the chip logic. */
  onChips: (change: (step: StepDraft, context: Context) => StepDraft) => void;
  /** What the change replaced. */
  onEdit: (edit: TextEdit, body: string) => void;
  /** Enter was pressed. */
  onEnter: () => void;
  /** The empty step at the end: its buttons are shown but inert. */
  free: boolean;
  /** Backspace was pressed in an empty step. */
  onBackspaceEmpty: () => void;
  onRemove: () => void;
  /** Insert an empty step above this one. */
  onInsert: () => void;
  /** Move one place up (-1) or down (1). */
  onMove: (direction: -1 | 1) => void;
  /** Pointer handlers for the grip, and the style the step gets while it is dragged or shifted aside. */
  gripProps: ComponentProps<'span'>;
  style?: CSSProperties;
};

/** One step: its header (number, grip and buttons) above its text. */
export function StepEditor({
  ref,
  number,
  step,
  context,
  canUp,
  canDown,
  onType,
  onChips,
  onEdit,
  onEnter,
  free,
  onBackspaceEmpty,
  onRemove,
  onInsert,
  onMove,
  gripProps,
  style,
}: Props) {
  const field = useRef<HTMLTextAreaElement>(null);
  const item = useRef<HTMLLIElement>(null);
  const afterRender = useAfterRender();
  // The chip whose words are filled in: the one hovered or focused, else the one the caret is in.
  const [chipHot, setChipHot] = useState<string>();
  const [caret, setCaret] = useState<number>();
  const hotId = chipHot ?? step.chips.find((c) => c.anchor && caret !== undefined && c.anchor.start < caret && caret < c.anchor.end)?.id;
  const marks: Mark[] = step.chips.flatMap((c) =>
    c.anchor ? [{ id: c.id, start: c.anchor.start, end: c.anchor.end, kind: c.mode, hot: c.id === hotId }] : [],
  );

  useImperativeHandle(ref, () => ({
    rect: () => item.current?.getBoundingClientRect(),
    focusField: (caret) => {
      const el = field.current;
      if (!el) return;
      el.focus();
      const at = caret === 'end' ? el.value.length : 0;
      el.setSelectionRange(at, at);
    },
  }));

  // Alt and an arrow move the step and keep focus and caret in its text.
  const keyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing || !e.altKey || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
    e.preventDefault();
    const direction = e.key === 'ArrowDown' ? 1 : -1;
    if (!(direction === 1 ? canDown : canUp)) return;
    const selection: [number, number] = [e.currentTarget.selectionStart, e.currentTarget.selectionEnd];
    afterRender(() => {
      field.current?.focus();
      field.current?.setSelectionRange(...selection);
    });
    onMove(direction);
  };

  return (
    <li ref={item} style={style} className="group relative border-t-2 border-dashed border-ink/30 pt-4.5 pb-5 first:border-t-0 first:pt-0">
      <div className="mb-1 flex items-center gap-2">
        <RowGrip {...gripProps} className="min-h-9 w-6" />
        <span className="mr-auto text-[0.8125rem] font-black tracking-[0.08em] text-red uppercase group-focus-within:text-blu">Stap {number}</span>
        <RowToolbar
          label={`Acties voor stap ${number}`}
          deleteLabel="Verwijder stap"
          insertLabel="Voeg stap toe boven"
          onInsert={onInsert}
          canUp={canUp}
          canDown={canDown}
          trash
          disabled={free}
          onMove={onMove}
          onDelete={onRemove}
        />
      </div>
      <StepText
        ref={field}
        label={`Stap ${number}`}
        value={step.body}
        marks={marks}
        placeholder={number === 1 ? 'Kneed de bloem met de boter tot een deeg' : 'Wat doe je in deze stap?'}
        onChange={onType}
        onEdit={onEdit}
        onCaret={setCaret}
        onKeyDown={keyDown}
        onEnter={onEnter}
        onBackspaceEmpty={onBackspaceEmpty}
      />
      <StepChips step={step} context={context} number={number} hotId={hotId} onHot={setChipHot} onChange={onChips} />
    </li>
  );
}
