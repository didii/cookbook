import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { Link } from 'react-router';
import { cn } from '~app/shared/cn';
import { Button } from '~app/shared/components';

interface SaveBarProps extends ComponentProps<'div'> {
  /** Where "Annuleren" leads. */
  cancelTo: string;
  /** Whether "Opslaan" has been used and the answer has not arrived yet. */
  busy: boolean;
  /** Whether "Opslaan" must wait for something else (a photo that is uploading or failed). */
  saveBlocked?: boolean;
  /** Whether the editor differs from its starting values: shows the status and "Herstel". */
  dirty: boolean;
  /** Whether the unsaved changes are kept on this device (see `useDraftPersistence`). */
  kept: boolean;
  /** Puts every field back to its starting values. */
  onFormReset: () => void;
  /** Extra status next to "Niet opgeslagen" (used by later changes). */
  children?: ReactNode;
}

/** The bar fixed to the bottom of the editor: status, Herstel, Annuleren and Opslaan. */
export function SaveBar({ cancelTo, busy, saveBlocked, dirty, kept, onFormReset, children, className, ...props }: SaveBarProps) {
  const [asking, setAsking] = useState(false);
  // The question only exists while there is something to reset.
  const question = asking && dirty;
  const herstel = useRef<HTMLButtonElement>(null);
  const nee = useRef<HTMLButtonElement>(null);
  const wasAsking = useRef(false);
  // The safe answer gets focus when the question appears; after answering, focus goes back to where the question was asked from (unless the reset removed that button).
  useEffect(() => {
    if (question) nee.current?.focus();
    else if (wasAsking.current) herstel.current?.focus();
    wasAsking.current = question;
  }, [question]);

  // Esc declines, wherever focus is.
  useEffect(() => {
    if (!question) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setAsking(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [question]);

  return (
    <div {...props} className={cn('fixed inset-x-0 bottom-0 z-10 border-t-3 border-ink bg-por pb-[env(safe-area-inset-bottom)]', className)}>
      <div className="mx-auto flex max-w-290 items-center gap-3 px-[max(1rem,4vw)] py-2.5 max-sm:flex-wrap max-sm:gap-y-0">
        {/* On a phone the status gets a row of its own above the buttons. */}
        <div className="flex flex-wrap items-center gap-x-3 text-sm font-extrabold empty:hidden max-sm:basis-full sm:text-base">
          {dirty && (
            <span className="flex items-center gap-2">
              <span aria-hidden="true" className="size-2.5 rounded-full border-2 border-ink bg-yel" />
              Niet opgeslagen{kept && ' · Concept bewaard'}
            </span>
          )}
          {children}
        </div>
        {/* Own `ml-auto` group: the status above hides when empty, so its `mr-auto` can't keep the buttons right. */}
        <div className="ml-auto flex items-center gap-3 max-sm:flex-1">
          {question ? (
            <fieldset className="m-0 flex min-w-0 items-center gap-2 border-0 p-0">
              <legend className="float-left mr-2 font-extrabold">Alles terugzetten?</legend>
              <button
                type="button"
                onClick={() => {
                  setAsking(false);
                  onFormReset();
                }}
                className="min-h-11 cursor-pointer px-2 font-black text-red underline"
              >
                Ja
              </button>
              <button ref={nee} type="button" onClick={() => setAsking(false)} className="min-h-11 cursor-pointer px-2 font-black underline">
                Nee
              </button>
            </fieldset>
          ) : (
            dirty && (
              <button
                ref={herstel}
                type="button"
                onClick={() => setAsking(true)}
                className="min-h-11 cursor-pointer px-2 font-black text-muted underline"
              >
                Herstel
              </button>
            )
          )}
          <Link to={cancelTo} className="inline-flex min-h-13 items-center px-2 font-black text-blu hover:underline">
            Annuleren
          </Link>
          <Button type="submit" main disabled={busy || saveBlocked} className="max-w-none min-w-32 flex-none px-4 max-sm:flex-1">
            Opslaan
          </Button>
        </div>
      </div>
    </div>
  );
}
