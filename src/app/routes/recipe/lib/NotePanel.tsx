import { Lock, StickyNote } from '~app/shared/icons';
import { maxNoteLength } from './note';
import { NoteCue } from './NoteCue';
import type { Note } from './useNote';

type Props = { note: Note };

/** Wide screens: the note under the ingredient list, always visible, saved when the field loses focus or typing pauses. Hidden below 52rem, where `NoteSheet` takes over. */
export function NotePanel({ note }: Props) {
  return (
    <section
      aria-labelledby="note-title"
      data-testid="NotePanel-panel"
      className="mt-6 rounded-xl border-3 border-ink bg-white px-4 pt-3.5 pb-4 shadow-hard max-[51.99rem]:hidden"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 id="note-title" className="inline-flex items-center gap-2 text-xl font-black">
          <StickyNote /> Mijn notitie
        </h2>
        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-muted">
          <Lock className="size-4" /> Alleen voor jou
        </span>
      </div>
      <textarea
        data-testid="NotePanel-field"
        aria-label="Mijn notitie"
        maxLength={maxNoteLength}
        value={note.text}
        onChange={(e) => note.change(e.target.value)}
        onBlur={note.blur}
        className="mt-2.5 box-border min-h-28 w-full resize-y rounded-[10px] border-3 border-ink bg-[#fffdf7] px-3 py-2.5 text-lg leading-snug font-semibold text-ink"
      />
      {note.failed && (
        <p data-testid="NotePanel-failed" role="alert" className="mt-2 text-sm font-bold text-red">
          Notitie niet bewaard. Verlaat het veld om het opnieuw te proberen.
        </p>
      )}
      <NoteCue cue={note.cue} onClear={note.clearCue} onEnd={note.endCue} className="text-jade" />
    </section>
  );
}
