import { RecipeCard } from '~app/shared/components';
import type { RecipeSummary } from '~app/shared/recipe';
import { MissingIngredients } from './MissingIngredients';
import { UnusedEntries } from './UnusedEntries';

type Props = {
  recipe: RecipeSummary;
  tile: number;
  eager?: boolean;
  onSaved?: () => void;
  /** How many "Heb ik" entries there are. With none the card is the plain recipe card. */
  total: number;
  /** The "Heb ik" entries this recipe uses and does not use. */
  used: string[];
  unused: string[];
  /** The ingredients nothing in the house covers. */
  missing: string[];
  onHave: (name: string) => void;
  onSkip: (name: string) => void;
};

/** The recipe card with, once "Heb ik" has entries, "N/M in huis" under the tags (part of what opens the recipe) and below a separator the plain part with what is missing and what is not used. */
export function FridgeCard({ total, used, unused, missing, onHave, onSkip, ...card }: Props) {
  if (total === 0) return <RecipeCard {...card} />;
  const plain = missing.length > 0 || unused.length > 0;
  return (
    <RecipeCard
      {...card}
      footer={
        <p data-testid="FridgeCard-count" className="mt-1.5 font-black text-blu">
          {used.length}/{total} in huis
        </p>
      }
    >
      {plain && (
        <>
          <MissingIngredients names={missing} onHave={onHave} onSkip={onSkip} />
          <UnusedEntries entries={unused} />
        </>
      )}
    </RecipeCard>
  );
}
