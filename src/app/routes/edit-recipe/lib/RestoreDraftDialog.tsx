import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { cn } from '~app/shared/cn';
import type { RecipeDraft } from './draft';
import { describeSavedAt } from './draftStore';

interface RestoreDraftDialogProps extends Omit<ComponentProps<'dialog'>, 'onCancel'> {
  /** The unfinished new recipe the device holds. */
  draft: RecipeDraft;
  /** When the draft was kept. */
  savedAt: string;
  onUse: () => void;
  onDiscard: () => void;
}

const shownIngredients = 3;
const shownSteps = 2;

/** Modal popup that opens on mount and asks whether to use the draft of a new recipe; it stays until one of the two buttons is pressed. */
export function RestoreDraftDialog({ draft, savedAt, onUse, onDiscard, className, ...props }: RestoreDraftDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [kept] = useState(() => describeSavedAt(savedAt, new Date()));
  useEffect(() => {
    if (!dialog.current?.open) dialog.current?.showModal();
  }, []);
  const ingredients = draft.ingredients.map((row) => row.text.trim()).filter(Boolean);
  const steps = draft.steps.map((step) => step.body.trim()).filter(Boolean);
  return (
    <dialog
      {...props}
      ref={dialog}
      aria-labelledby="restore-title"
      // Escape closes a modal dialog by default; the choice must be made.
      onCancel={(e) => e.preventDefault()}
      className={cn(
        'm-auto max-h-[calc(100dvh-2rem)] w-[min(28rem,calc(100vw-2rem))] overflow-y-auto rounded-xl border-3 border-ink bg-white p-0 text-ink shadow-hard backdrop:bg-ink/40',
        className,
      )}
    >
      <div className="grid gap-4 p-6">
        <h2 id="restore-title" data-testid="RestoreDraftDialog-heading" className="text-xl font-black text-balance">
          Je hebt nog een onafgemaakt recept
        </h2>
        <p data-testid="RestoreDraftDialog-savedAt" className="text-muted">
          Bewaard {kept}
        </p>
        {draft.image && (
          <img data-testid="RestoreDraftDialog-photo" src={draft.image} alt="" className="max-h-48 w-full rounded-[0.625rem] object-cover" />
        )}
        {draft.title.trim() && (
          <p data-testid="RestoreDraftDialog-title" className="text-lg font-black">
            {draft.title}
          </p>
        )}
        {draft.servings.trim() && <p data-testid="RestoreDraftDialog-servings">{draft.servings}</p>}
        {draft.source.trim() && (
          <p data-testid="RestoreDraftDialog-source" className="wrap-break-word">
            {draft.source}
          </p>
        )}
        {ingredients.length > 0 && (
          <ul className="list-disc pl-5">
            {ingredients.slice(0, shownIngredients).map((text, i) => (
              <li key={i} data-testid="RestoreDraftDialog-ingredient">
                {text}
              </li>
            ))}
          </ul>
        )}
        {ingredients.length > shownIngredients && (
          <p data-testid="RestoreDraftDialog-moreIngredients" className="text-muted">
            + {ingredients.length - shownIngredients} meer
          </p>
        )}
        {steps.length > 0 && (
          <ol className="list-decimal pl-5">
            {steps.slice(0, shownSteps).map((body, i) => (
              <li key={i} data-testid="RestoreDraftDialog-step">
                {body}
              </li>
            ))}
          </ol>
        )}
        {steps.length > shownSteps && (
          <p data-testid="RestoreDraftDialog-moreSteps" className="text-muted">
            + {steps.length - shownSteps} meer
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            data-testid="RestoreDraftDialog-discard"
            onClick={onDiscard}
            className="min-h-11 cursor-pointer rounded-full border-3 border-ink bg-white px-5 font-extrabold hover:bg-yel"
          >
            Weggooien
          </button>
          <button
            type="button"
            data-testid="RestoreDraftDialog-use"
            onClick={onUse}
            className="min-h-11 cursor-pointer rounded-full border-3 border-ink bg-yel px-5 font-extrabold"
          >
            Gebruik concept
          </button>
        </div>
      </div>
    </dialog>
  );
}
