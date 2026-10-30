import { useState } from 'react';
import { cn } from '~app/shared/cn';
import { hoverRecolor, hoverTint } from '~app/shared/hover';
import { Minus, Plus } from '~app/shared/icons';

type Props = {
  /** The ingredients that nothing in the house covers, in recipe order. */
  names: string[];
  /** The "+" of a row: the ingredient is in the house. */
  onHave: (name: string) => void;
  /** The "−" of a row: the ingredient is not wanted. */
  onSkip: (name: string) => void;
};

const shown = 5;

/** "Ontbreekt": the ingredients still needed, each with a quiet + and − button. Shows five rows and a "+N meer" button for the rest. Nothing when none is missing. */
export function MissingIngredients({ names, onHave, onSkip }: Props) {
  const [all, setAll] = useState(false);
  if (names.length === 0) return null;
  const rest = names.length - shown;
  const visible = all || rest <= 0 ? names : names.slice(0, shown);
  // Hit area 44 x 48px, the buttons close together; the outline and the icon are the only things drawn.
  const mini = cn('grid h-12 w-11 flex-none cursor-pointer place-items-center rounded-[0.625rem] text-muted hover:text-ink [&+&]:-ml-1', hoverTint);
  const icon = 'box-content rounded-lg border-2 border-ink/15 p-[3px]';
  return (
    <section data-testid="MissingIngredients-section" className="mt-3">
      <h3 data-testid="MissingIngredients-heading" className="mb-1 text-[0.9375rem] font-black text-muted">
        Ontbreekt
      </h3>
      <ul className="m-0 list-none p-0">
        {visible.map((name) => (
          <li key={name} data-testid="MissingIngredients-row" className="flex items-center border-t-2 border-ink/15">
            <span data-testid="MissingIngredients-name" className="flex-1 font-extrabold">
              {name}
            </span>
            <button type="button" data-testid="MissingIngredients-have" aria-label={`Ik heb ${name}`} onClick={() => onHave(name)} className={mini}>
              <Plus className={cn(icon, 'size-5 stroke-[3.5]')} />
            </button>
            <button
              type="button"
              data-testid="MissingIngredients-skip"
              aria-label={`Liever geen ${name}`}
              onClick={() => onSkip(name)}
              className={mini}
            >
              <Minus className={cn(icon, 'size-5 stroke-[3.5]')} />
            </button>
          </li>
        ))}
      </ul>
      {!all && rest > 0 && (
        <button
          type="button"
          data-testid="MissingIngredients-more"
          onClick={() => setAll(true)}
          className={cn('min-h-11 cursor-pointer font-black text-blu underline', hoverRecolor)}
        >
          +{rest} meer
        </button>
      )}
    </section>
  );
}
