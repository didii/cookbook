import type { ComponentProps } from 'react';
import { cn } from '~app/shared/cn';
import type { Recipe } from '~app/shared/recipe';

interface IngredientListProps extends ComponentProps<'ul'> {
  ingredients: Recipe['ingredients'];
  ticked: ReadonlySet<number>;
  onToggleIngredient: (index: number) => void;
}

export function IngredientList({ ingredients, ticked, onToggleIngredient, className, ...props }: IngredientListProps) {
  return (
    <ul {...props} className={cn('grid list-none gap-2 p-0', className)}>
      {ingredients.map((x, i) => (
        <li key={i} id={`ingredient-${i + 1}`}>
          <label
            data-testid="IngredientList-row"
            className="group flex min-h-13 cursor-pointer items-center gap-3 rounded-[0.625rem] border-3 border-ink bg-white px-3.5 py-2 text-[1.1875rem] font-bold hover:not-focus:bg-hover has-checked:opacity-55"
          >
            <input
              type="checkbox"
              data-testid="IngredientList-checkbox"
              checked={ticked.has(i)}
              onChange={() => onToggleIngredient(i)}
              className="m-0 size-6 shrink-0 cursor-pointer appearance-none rounded-full border-3 border-ink bg-white checked:bg-jade checked:shadow-[inset_0_0_0_3px_#fff]"
            />
            <b data-testid="IngredientList-quantity" className="min-w-14 font-black text-blu tabular-nums">
              {x.quantityText}
            </b>
            <span data-testid="IngredientList-name">{x.name}</span>
          </label>
        </li>
      ))}
    </ul>
  );
}
