import { Button } from '~app/shared/components';

interface TagActionsProps {
  /** A request is on its way: the buttons wait. */
  pending: boolean;
  onMerge: () => void;
  onDelete: () => void;
}

const action = 'min-h-12 flex-none px-4 text-base';

/** The usual actions of a tag form: save (the submit button of the form around it), merge and delete. */
export function TagActions({ pending, onMerge, onDelete }: TagActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="submit" main data-testid="TagActions-save" disabled={pending} className={action}>
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
