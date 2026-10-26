import { useId } from 'react';
import { Button, Pill } from '~app/shared/components';
import type { ManagedTag } from '~app/shared/tags';
import { recipeCount } from './recipeCount';
import { SuggestInput } from './SuggestInput';

interface MergeActionsProps {
  /** The tag that is merged away. */
  tag: ManagedTag;
  /** The names of the other tags, to pick from. */
  others: string[];
  /** The typed text of the picker. */
  value: string;
  onValueChange: (value: string) => void;
  /** The stored tag (other than this one) that the typed text names, if any. */
  chosen: string | undefined;
  onCancel: () => void;
  pending: boolean;
}

const action = 'min-h-12 flex-none px-4 text-base';

/** Takes the place of the actions: pick the tag that stays, see what happens, merge or cancel. */
export function MergeActions({ tag, others, value, onValueChange, chosen, onCancel, pending }: MergeActionsProps) {
  const id = useId();
  return (
    <div className="grid gap-3">
      <div>
        <label htmlFor={id} className="mb-1 block text-[0.9375rem] font-black">
          Voeg <Pill>{tag.name}</Pill> samen met
        </label>
        <SuggestInput id={id} items={others} value={value} onValueChange={onValueChange} placeholder="Kies een tag" />
      </div>
      <div data-testid="MergeActions-preview" className="rounded-[0.625rem] border-3 border-ink bg-white px-3 py-2.5 font-bold">
        {chosen ? (
          <>
            <b className="font-black">{recipeCount(tag.uses)}</b> met <Pill data-testid="MergeActions-from">{tag.name}</Pill> krijgen{' '}
            <Pill data-testid="MergeActions-into">{chosen}</Pill>. Recepten die al {chosen} hebben, houden het één keer. {tag.name} verdwijnt.
          </>
        ) : (
          'Kies de tag die blijft. Deze tag verdwijnt.'
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" main data-testid="MergeActions-confirm" disabled={!chosen || pending} className={action}>
          Samenvoegen
        </Button>
        <Button type="button" data-testid="MergeActions-cancel" onClick={onCancel} className={action}>
          Annuleer
        </Button>
      </div>
    </div>
  );
}
