import { useEffect, useRef } from 'react';
import { cn } from '~app/shared/cn';
import { Check, Cross, Lock, StickyNote } from '~app/shared/icons';
import { maxNoteLength } from './note';
import { NoteCue } from './NoteCue';
import type { Note } from './useNote';

type Props = { note: Note };

/** Narrow screens: a floating button at the bottom right that opens the note field above it. Hidden from 52rem, where `NotePanel` takes over. */
export function NoteSheet({ note }: Props) {
  const button = useRef<HTMLButtonElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const wasOpen = useRef(false);
  const { isOpen, dismiss } = note;

  // Focus goes into the field on opening and back to the button on closing.
  useEffect(() => {
    if (isOpen) field.current?.focus();
    else if (wasOpen.current) button.current?.focus();
    wasOpen.current = isOpen;
  }, [isOpen]);

  // Escape closes it; a tap on the scrim does too (see below).
  useEffect(() => {
    if (!isOpen) return;
    const escape = (e: KeyboardEvent) => e.key === 'Escape' && dismiss();
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, [isOpen, dismiss]);

  return (
    <div data-testid="NoteSheet-root" className="min-[52rem]:hidden">
      {isOpen && <div data-testid="NoteSheet-scrim" className="fixed inset-0 z-30 bg-ink/30" aria-hidden="true" onClick={dismiss} />}
      {isOpen && (
        <dialog
          open
          aria-label="Mijn notitie"
          data-testid="NoteSheet-sheet"
          className="fixed inset-x-4 m-0 w-[calc(100%-2rem)] text-ink bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 animate-rise rounded-xl border-3 border-ink bg-white px-4 pt-3.5 pb-4 shadow-hard motion-reduce:animate-none"
        >
          <div className="flex items-baseline justify-between gap-2">
            <b className="text-xl font-black">Mijn notitie</b>
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-muted">
              <Lock className="size-4" /> Alleen voor jou
            </span>
          </div>
          <textarea
            ref={field}
            data-testid="NoteSheet-field"
            aria-label="Mijn notitie"
            maxLength={maxNoteLength}
            value={note.text}
            onChange={(e) => note.change(e.target.value)}
            className="mt-2.5 box-border min-h-36 w-full resize-none rounded-[10px] border-3 border-ink bg-[#fffdf7] px-3 py-2.5 text-lg/snug  font-semibold text-ink"
          />
          <output data-testid="NoteSheet-status" className="mt-2 block">
            {note.failed ? (
              <p data-testid="NoteSheet-failed" className="text-sm font-bold text-red">
                Notitie niet bewaard. Sluit of typ verder om het opnieuw te proberen.
              </p>
            ) : note.savedSinceOpen ? (
              <p data-testid="NoteSheet-saved" className="flex items-center gap-1.5 font-black text-jade">
                <Check className="size-4.5" /> Bewaard
              </p>
            ) : (
              <p data-testid="NoteSheet-hint" className="text-sm font-bold text-muted">
                Wordt vanzelf bewaard. Tik buiten het veld om te sluiten.
              </p>
            )}
          </output>
        </dialog>
      )}
      <div className="fixed right-4 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-40">
        <NoteCue
          cue={note.cue}
          onClear={note.clearCue}
          onEnd={note.endCue}
          className="rounded-[10px] border-3 border-ink bg-jade px-3.5 text-white shadow-hard-sm"
        />
      </div>
      <button
        ref={button}
        type="button"
        data-testid="NoteSheet-button"
        aria-label={isOpen ? 'Sluit mijn notitie' : 'Open mijn notitie'}
        aria-expanded={isOpen}
        onClick={() => (isOpen ? dismiss() : note.open())}
        className={cn(
          'fixed right-4 bottom-[calc(1.125rem+env(safe-area-inset-bottom))] z-40 grid size-14 cursor-pointer place-items-center rounded-[14px] border-3 border-ink shadow-hard',
          'transition-[translate,box-shadow] duration-80 active:[translate:3px_3px] active:shadow-none motion-reduce:transition-none',
          isOpen ? 'bg-red text-white' : 'bg-yel text-ink',
        )}
      >
        {isOpen ? <Cross /> : <StickyNote />}
        {!isOpen && note.text !== '' && (
          <span data-testid="NoteSheet-marker" className="absolute -top-2 -right-2 size-4.5 rounded-full border-2 border-ink bg-red" />
        )}
      </button>
    </div>
  );
}
