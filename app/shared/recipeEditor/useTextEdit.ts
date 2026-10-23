import { useEffect, useRef, type ChangeEvent, type CompositionEvent, type RefObject } from 'react';
import { computeEdit, type Selection, type TextEdit } from '~/lib/textEdit';

type Options = {
  /** The text the field shows now, before the change that is being reported. */
  value: string;
  /** Rewrites the text the browser produced (for instance line breaks to spaces) before anything sees it. Must keep the length. */
  sanitize?: (text: string) => string;
  /** The field's text changed; also called for every step of a composition. */
  onChange: (value: string) => void;
  /** What the change replaced, with the new text; once per change, and for a composition once when it ends. */
  onEdit: (edit: TextEdit, value: string) => void;
};

/**
 * Makes a controlled textarea report what each change replaced. Spread the result on the textarea.
 * The selection before a change is read in the native `beforeinput` event (React's own is not it), and undo and redo are left to the comparison of the texts.
 */
export function useTextEdit(field: RefObject<HTMLTextAreaElement | null>, { value, sanitize, onChange, onEdit }: Options) {
  const hint = useRef<Selection>(undefined);
  // The text before the composition that is going on, if any.
  const composing = useRef<string>(undefined);

  useEffect(() => {
    const el = field.current;
    if (!el) return;
    const capture = (e: InputEvent) => {
      hint.current = e.inputType.startsWith('history') ? undefined : { start: el.selectionStart, end: el.selectionEnd };
    };
    el.addEventListener('beforeinput', capture);
    return () => el.removeEventListener('beforeinput', capture);
  }, [field]);

  const change = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    const raw = el.value;
    const next = sanitize ? sanitize(raw) : raw;
    if (next !== raw) {
      // Writing the value moves the caret to the end, so put it back.
      const { selectionStart, selectionEnd } = el;
      el.value = next;
      el.setSelectionRange(selectionStart, selectionEnd);
    }
    const selection = hint.current;
    hint.current = undefined;
    onChange(next);
    if (composing.current === undefined) onEdit(computeEdit(value, next, selection), next);
  };
  const start = (e: CompositionEvent<HTMLTextAreaElement>) => {
    composing.current = e.currentTarget.value;
  };
  const end = (e: CompositionEvent<HTMLTextAreaElement>) => {
    const before = composing.current;
    composing.current = undefined;
    if (before !== undefined) onEdit(computeEdit(before, e.currentTarget.value), e.currentTarget.value);
  };

  return { onChange: change, onCompositionStart: start, onCompositionEnd: end };
}
