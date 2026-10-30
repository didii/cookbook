import { Button, Pill } from '~app/shared/components';
import type { ManagedTag } from '~app/shared/tags';
import { recipeCount } from './recipeCount';

interface DeleteActionsProps {
  tag: ManagedTag;
  onCancel: () => void;
  pending: boolean;
}

const action = 'min-h-12 flex-none px-4 text-base';

/** Takes the place of the actions: says on how many recipes the tag is, then deletes or cancels. */
export function DeleteActions({ tag, onCancel, pending }: DeleteActionsProps) {
  return (
    <div className="grid gap-3">
      <p data-testid="DeleteActions-notice" role="alert" className="rounded-[0.625rem] border-3 border-red bg-white px-3 py-2.5 font-bold">
        <Pill>{tag.name}</Pill>{' '}
        {tag.uses > 0 ? (
          <>
            staat op <b className="font-black">{recipeCount(tag.uses)}</b>. De tag verdwijnt daar; de recepten blijven bestaan.
          </>
        ) : (
          'staat op geen enkel recept.'
        )}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          data-testid="DeleteActions-confirm"
          disabled={pending}
          className={`${action} bg-red text-white hover:not-disabled:bg-red hover:not-disabled:brightness-90`}
        >
          Verwijder tag
        </Button>
        <Button type="button" data-testid="DeleteActions-cancel" onClick={onCancel} className={action}>
          Annuleer
        </Button>
      </div>
    </div>
  );
}
