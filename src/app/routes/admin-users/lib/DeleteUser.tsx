import { useRef } from 'react';
import { Form } from 'react-router';

type Props = { name: string; isSelf: boolean; accessUrl: string; disabledReason?: string };

const lostAccess = 'Je verliest hiermee de toegang tot deze pagina.';

/** "Verwijderen" button with a modal confirm popup. Disabled, with its reason as visible text beside it, when `disabledReason` is given. */
export function DeleteUser({ name, isSelf, accessUrl, disabledReason }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <div className="mt-6">
      <button
        type="button"
        data-testid="DeleteUser-open"
        disabled={!!disabledReason}
        aria-describedby={disabledReason ? 'delete-reason' : undefined}
        onClick={() => dialog.current?.showModal()}
        className="inline-flex min-h-11 cursor-pointer items-center rounded-full border-3 border-red px-5 font-extrabold text-red hover:bg-red hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-red"
      >
        Verwijderen
      </button>
      {disabledReason && (
        <p id="delete-reason" data-testid="DeleteUser-reason" className="mt-1 text-muted">
          {disabledReason}
        </p>
      )}
      {/* Escape and the focus trap come with showModal. The dialog has no padding of its own, so a click whose target is the dialog itself is a click on the backdrop. */}
      {/* oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- a mouse shortcut for the backdrop; keyboard users have Escape and "Annuleren" */}
      <dialog
        ref={dialog}
        data-testid="DeleteUser-dialog"
        aria-labelledby="delete-user-title"
        onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
        className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-xl border-3 border-ink bg-white p-0 text-ink shadow-hard backdrop:bg-ink/40"
      >
        <Form method="post" className="grid gap-5 p-6">
          <input type="hidden" data-testid="DeleteUser-intent" name="intent" value="delete" />
          <h2 id="delete-user-title" data-testid="DeleteUser-title" className="text-xl font-black text-balance">
            “{name}” verwijderen?
          </h2>
          <p>Het account en de gezien-markeringen van dit lid worden verwijderd. Recepten blijven staan.</p>
          <p data-testid="DeleteUser-allowlist">
            Hij of zij kan opnieuw inloggen zolang het e-mailadres op de toegestane lijst staat.{' '}
            <a href={accessUrl} target="_blank" rel="noreferrer" data-testid="DeleteUser-link" className="font-extrabold underline">
              Beheer de lijst in Cloudflare
            </a>
          </p>
          {isSelf && (
            <p data-testid="DeleteUser-warning" className="font-bold text-red">
              {lostAccess}
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              data-testid="DeleteUser-cancel"
              onClick={() => dialog.current?.close()}
              className="min-h-11 rounded-full border-3 border-ink bg-white px-5 font-extrabold hover:bg-yel"
            >
              Annuleren
            </button>
            <button
              type="submit"
              data-testid="DeleteUser-confirm"
              className="min-h-11 rounded-full border-3 border-ink bg-red px-5 font-extrabold text-white"
            >
              Verwijderen
            </button>
          </div>
        </Form>
      </dialog>
    </div>
  );
}
