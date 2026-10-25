import { useRef, type ComponentProps } from 'react';
import { Form } from 'react-router';
import { cn } from '~app/shared/cn';

interface DeleteRecipeProps extends ComponentProps<'div'> {
  headingText: string;
  /** The recipe's slug: the delete form posts to its delete route. */
  slug: string;
}

/** Button at the bottom of the edit page; it opens a modal popup that asks for confirmation before the recipe is deleted. */
export function DeleteRecipe({ headingText, slug, className, ...props }: DeleteRecipeProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <div {...props} className={cn('mt-10 flex justify-center', className)}>
      <button
        type="button"
        data-testid="DeleteRecipe-open"
        onClick={() => dialog.current?.showModal()}
        className="inline-flex min-h-11 cursor-pointer items-center rounded-full border-3 border-red px-5 font-extrabold text-red hover:bg-red hover:text-white"
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
        <Form method="post" action={`/recepten/${slug}/verwijderen`} className="grid gap-5 p-6">
          <h2 id="delete-title" data-testid="DeleteRecipe-title" className="text-xl font-black text-balance">
            Recept “{headingText}” verwijderen?
          </h2>
          <p>Het recept met zijn foto wordt verwijderd. Dit kan niet ongedaan worden gemaakt.</p>
          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              data-testid="DeleteRecipe-cancel"
              onClick={() => dialog.current?.close()}
              className="min-h-11 rounded-full border-3 border-ink bg-white px-5 font-extrabold hover:bg-yel"
            >
              Annuleren
            </button>
            <button
              type="submit"
              data-testid="DeleteRecipe-confirm"
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
