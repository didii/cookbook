import { useImperativeHandle, useRef, type ComponentProps, type CSSProperties, type KeyboardEvent, type Ref } from 'react';
import type { TextEdit } from '~/lib/textEdit';
import type { ItemHandle } from './ItemHandle';
import { RowGrip } from './RowGrip';
import { RowToolbar } from './RowToolbar';
import { StepText } from './StepText';
import { useAfterRender } from './useAfterRender';

type Props = {
  ref?: Ref<ItemHandle>;
  /** The step's number, counting from 1. */
  number: number;
  text: string;
  canUp: boolean;
  canDown: boolean;
  onType: (text: string) => void;
  /** What the change replaced. */
  onEdit: (edit: TextEdit, body: string) => void;
  /** Enter was pressed at the end of a step that has text. */
  onEnterAtEnd: () => void;
  /** Backspace was pressed in an empty step. */
  onBackspaceEmpty: () => void;
  onRemove: () => void;
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
  text,
  canUp,
  canDown,
  onType,
  onEdit,
  onEnterAtEnd,
  onBackspaceEmpty,
  onRemove,
  onMove,
  gripProps,
  style,
}: Props) {
  const field = useRef<HTMLTextAreaElement>(null);
  const item = useRef<HTMLLIElement>(null);
  const afterRender = useAfterRender();

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
          canUp={canUp}
          canDown={canDown}
          trash
          onMove={onMove}
          onDelete={onRemove}
        />
      </div>
      <StepText
        ref={field}
        label={`Stap ${number}`}
        value={text}
        placeholder={number === 1 ? 'Bijvoorbeeld: Kneed de bloem met de boter tot een deeg' : undefined}
        onChange={onType}
        onEdit={onEdit}
        onKeyDown={keyDown}
        onEnterAtEnd={onEnterAtEnd}
        onBackspaceEmpty={onBackspaceEmpty}
      />
    </li>
  );
}
