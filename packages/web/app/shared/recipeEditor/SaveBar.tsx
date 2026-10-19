import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Button } from '~/shared/Button';

type Props = {
  /** Where "Annuleren" leads. */
  cancelTo: string;
  /** Whether "Opslaan" has been used and the answer has not arrived yet. */
  busy: boolean;
  /** Whether the editor differs from its starting values: shows the status and "Herstel". */
  dirty: boolean;
  /** Puts every field back to its starting values. */
  onReset: () => void;
  /** Extra status next to "Niet opgeslagen" (used by later changes). */
  children?: ReactNode;
};

/** The bar fixed to the bottom of the editor: status, Herstel, Annuleren and Opslaan. */
export function SaveBar({ cancelTo, busy, dirty, onReset, children }: Props) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-10 border-t-3 border-ink bg-por pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-290 items-center gap-3 px-[max(1rem,4vw)] py-2.5">
        <div className="mr-auto flex flex-wrap items-center gap-x-3 text-sm font-extrabold sm:text-base">
          {dirty && (
            <span className="flex items-center gap-2">
              <span aria-hidden="true" className="size-2.5 rounded-full border-2 border-ink bg-yel" />
              Niet opgeslagen
            </span>
          )}
          {children}
        </div>
        {dirty && (
          <button type="button" onClick={onReset} className="min-h-11 cursor-pointer px-2 font-black text-muted underline">
            Herstel
          </button>
        )}
        <Link to={cancelTo} className="inline-flex min-h-13 items-center px-2 font-black text-blu">
          Annuleren
        </Link>
        <Button type="submit" main disabled={busy} className="max-w-none min-w-32 flex-none px-4 max-sm:flex-1">
          Opslaan
        </Button>
      </div>
    </div>
  );
}
