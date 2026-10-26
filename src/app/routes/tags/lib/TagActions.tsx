import { Button } from '~app/shared/components';

interface TagActionsProps {
  /** A request is on its way: the buttons wait. */
  pending: boolean;
  onSave: () => void;
  onMerge: () => void;
  onDelete: () => void;
}

const action = 'min-h-12 flex-none px-4 text-base';

/** The usual actions of a tag form: save, merge and delete. */
export function TagActions({ pending, onSave, onMerge, onDelete }: TagActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" main data-testid="TagActions-save" disabled={pending} onClick={onSave} className={action}>
        Opslaan
      </Button>
      <Button type="button" data-testid="TagActions-merge" disabled={pending} onClick={onMerge} className={action}>
        Samenvoegen met…
      </Button>
      <Button
        type="button"
        data-testid="TagActions-delete"
        disabled={pending}
        onClick={onDelete}
        className={`${action} bg-red text-white hover:not-disabled:bg-red`}
      >
        Verwijderen
      </Button>
    </div>
  );
}
