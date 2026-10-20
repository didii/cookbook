import { useImperativeHandle, useRef, type KeyboardEvent, type ReactNode, type Ref } from 'react';
import type { TextEdit } from '~/lib/textEdit';
import { cn } from '~/shared/cn';
import { useTextEdit } from './useTextEdit';

/** A range of the text to draw under: UTF-16 indexes into the value, `end` exclusive. Marks must not overlap; of two that do, the first wins. */
export type Mark = { id: string; start: number; end: number; kind: 'auto' | 'manual'; hot?: boolean };

type Props = {
  /** The textarea itself, for focus and selection. */
  ref?: Ref<HTMLTextAreaElement>;
  /** Accessible name of the field. */
  label: string;
  value: string;
  marks?: Mark[];
  placeholder?: string;
  onChange: (value: string) => void;
  /** What each change replaced, with the new text (see `useTextEdit`). */
  onEdit?: (edit: TextEdit, value: string) => void;
  /** Where the caret is (no selection), or undefined when there is a selection or the field lost focus. */
  onCaret?: (caret: number | undefined) => void;
  /** Enter was pressed with the caret at the end of a step that has text. */
  onEnterAtEnd?: () => void;
  /** Backspace was pressed in an empty field. */
  onBackspaceEmpty?: () => void;
  /** Called first for every key; a handler that calls preventDefault stops the field's own handling. */
  onKeyDown?: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
};

/** A step is one paragraph. */
const oneLine = (text: string) => text.replace(/[\r\n]/g, ' ');

const markClass = {
  auto: { line: 'decoration-yel', hot: 'bg-yel/35' },
  manual: { line: 'decoration-blu', hot: 'bg-blu/20' },
};

/** The text cut into plain pieces and marked pieces. */
function segments(value: string, marks: Mark[]): ReactNode[] {
  const parts: ReactNode[] = [];
  let at = 0;
  for (const mark of [...marks].sort((a, b) => a.start - b.start)) {
    const start = Math.max(mark.start, at);
    const end = Math.min(mark.end, value.length);
    if (end <= start) continue;
    parts.push(value.slice(at, start));
    // Only colour, fill and underline: nothing that takes room, so a mark never moves the text.
    parts.push(
      <mark
        key={mark.id}
        className={cn(
          'bg-transparent text-transparent underline decoration-[3px] underline-offset-4 [text-decoration-skip-ink:none]',
          markClass[mark.kind].line,
          mark.hot && markClass[mark.kind].hot,
        )}
      >
        {value.slice(start, end)}
      </mark>,
    );
    at = end;
  }
  parts.push(value.slice(at));
  return parts;
}

// One shared set of metrics: the box, the mirror and the textarea must wrap identically.
const field =
  'col-start-1 row-start-1 min-w-0 rounded-[0.625rem] border-3 px-3 py-2 text-xl leading-[1.4] font-bold whitespace-pre-wrap [overflow-wrap:anywhere]';

/**
 * The text of a step: a real textarea over a mirror of its own text. The mirror, not the textarea, sets the height (so the field grows without scripting) and carries the marks.
 * Enter never inserts a line break; pasted line breaks become spaces.
 */
export function StepText({
  ref,
  label,
  value,
  marks = [],
  placeholder,
  onChange,
  onEdit,
  onCaret,
  onEnterAtEnd,
  onBackspaceEmpty,
  onKeyDown,
}: Props) {
  const textarea = useRef<HTMLTextAreaElement>(null);
  useImperativeHandle(ref, () => textarea.current!);
  const handlers = useTextEdit(textarea, { value, sanitize: oneLine, onChange, onEdit: (edit, next) => onEdit?.(edit, next) });

  const keyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    onKeyDown?.(e);
    // Safari reports the Enter that confirms a composition after the composition ended, with key code 229.
    if (e.defaultPrevented || e.nativeEvent.isComposing || e.keyCode === 229) return;
    const el = e.currentTarget;
    if (e.key === 'Enter') {
      e.preventDefault();
      const atEnd = el.selectionStart === el.value.length && el.selectionEnd === el.value.length;
      if (!e.shiftKey && atEnd && el.value.trim()) onEnterAtEnd?.();
    } else if (e.key === 'Backspace' && !el.value) {
      e.preventDefault();
      onBackspaceEmpty?.();
    }
  };

  return (
    <div className="grid">
      <div aria-hidden="true" className={cn(field, 'border-transparent bg-white')} />
      <div aria-hidden="true" className={cn(field, 'pointer-events-none border-transparent text-transparent')}>
        {segments(value, marks)}
        {/* Keeps a last, empty line measured. */}
        {'​'}
      </div>
      <textarea
        ref={textarea}
        rows={1}
        value={value}
        placeholder={placeholder}
        aria-label={label}
        autoComplete="off"
        enterKeyHint="next"
        onKeyDown={keyDown}
        onSelect={(e) => onCaret?.(e.currentTarget.selectionStart === e.currentTarget.selectionEnd ? e.currentTarget.selectionStart : undefined)}
        onBlur={() => onCaret?.(undefined)}
        {...handlers}
        className={cn(
          field,
          'h-full w-full resize-none self-stretch overflow-hidden border-ink bg-transparent text-ink caret-ink placeholder:text-ink/50 hover:not-focus:bg-ink/5 focus:shadow-focus focus:outline-transparent',
        )}
      />
    </div>
  );
}
