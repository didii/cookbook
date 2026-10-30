import type { Ref } from 'react';
import { Button } from '~app/shared/components';
import { Trash } from '~app/shared/icons';
import { formatSize, photoCount } from './format';
import type { StoredPhotoInfo } from './photos';

interface DeleteDialogProps {
  /** The selected photos: the dialog names their number and size, and warns when one is under a day old. */
  photos: StoredPhotoInfo[];
  /** The caller opens it with `showModal()` and closes it with `close()`. */
  ref: Ref<HTMLDialogElement>;
  onCancel: () => void;
  onConfirm: () => void;
}

/** The confirmation before photos are deleted: a modal dialog in the middle of the screen, so the second click of a double click on the button below lands outside it. Escape, "Annuleer" and a click outside close it. */
export function DeleteDialog({ photos, ref, onCancel, onConfirm }: DeleteDialogProps) {
  return (
    // A click on the box itself is a click on the backdrop only when it is outside the dialog's rectangle.
    // oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- Escape is native; this is the backdrop click.
    <dialog
      ref={ref}
      data-testid="DeleteDialog-dialog"
      aria-labelledby="delete-photos-title"
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) e.currentTarget.close();
      }}
      className="m-auto w-[min(26rem,calc(100%-2rem))] rounded-[0.625rem] border-3 border-red bg-por p-5 text-ink shadow-hard-sm backdrop:bg-ink/55"
    >
      <p role="alert" id="delete-photos-title" className="font-bold">
        <b data-testid="DeleteDialog-title" className="block text-lg font-black text-red">
          Weet je het zeker?
        </b>
        <span data-testid="DeleteDialog-summary" className="mt-1 block text-[0.9375rem] text-muted">
          {photoCount(photos.length)}, {formatSize(photos.reduce((sum, p) => sum + p.size, 0))}.
        </span>
        {photos.some((p) => p.recent) && (
          <span data-testid="DeleteDialog-warning" className="mt-1 block text-[0.9375rem] text-muted">
            Een foto van minder dan een dag oud hoort misschien bij een formulier dat nog openstaat.
          </span>
        )}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" data-testid="DeleteDialog-cancel" autoFocus onClick={onCancel} className="min-h-12 flex-auto px-4 text-base">
          Annuleer
        </Button>
        <Button
          type="button"
          data-testid="DeleteDialog-confirm"
          onClick={onConfirm}
          className="min-h-12 flex-auto items-center justify-center gap-1.5 bg-red px-4 text-base text-white hover:not-disabled:bg-red hover:not-disabled:brightness-90"
        >
          <Trash /> Verwijder {photoCount(photos.length)}
        </Button>
      </div>
    </dialog>
  );
}
