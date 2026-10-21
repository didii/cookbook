import { useRef } from 'react';
import { Form } from 'react-router';

type Props = { title: string };

/** Button at the bottom of the recipe page; it opens a modal popup that asks for confirmation before the recipe is deleted. */
export function DeleteRecipe({ title }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <div className="mt-10 flex justify-center max-[51.99rem]:pb-16">
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className="inline-flex min-h-11 items-center font-extrabold text-muted underline underline-offset-[0.25em] hover:text-ink"
      >
        Verwijder recept
      </button>
      {/* Escape and the focus trap come with showModal. The dialog has no padding of its own, so a click whose target is the dialog itself is a click on the backdrop. */}
      {/* oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- a mouse shortcut for the backdrop; keyboard users have Escape and "Annuleren" */}
      <dialog
        ref={dialog}
        aria-labelledby="delete-title"
        onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
        className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-xl border-3 border-ink bg-white p-0 text-ink shadow-hard backdrop:bg-ink/40"
      >
        <Form method="post" className="grid gap-5 p-6">
          <h2 id="delete-title" className="text-xl font-black text-balance">
            Recept “{title}” verwijderen?
          </h2>
          <p>Het recept met zijn foto wordt verwijderd. Dit kan niet ongedaan worden gemaakt.</p>
          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className="min-h-11 rounded-full border-3 border-ink bg-white px-5 font-extrabold hover:bg-yel"
            >
              Annuleren
            </button>
            <button type="submit" className="min-h-11 rounded-full border-3 border-ink bg-red px-5 font-extrabold text-white">
              Verwijderen
            </button>
          </div>
        </Form>
      </dialog>
    </div>
  );
}
