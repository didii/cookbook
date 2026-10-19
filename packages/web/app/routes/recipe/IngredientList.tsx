import type { StoredRecipe } from '~/.server/recipes';
import { cn } from '~/shared/cn';

type Props = { ingredients: StoredRecipe['ingredients']; ticked: ReadonlySet<number>; onToggle: (index: number) => void; className?: string };

export function IngredientList({ ingredients, ticked, onToggle, className }: Props) {
  return (
    <ul className={cn('grid list-none gap-2 p-0', className)}>
      {ingredients.map((x, i) => (
        <li key={i} id={`ingredient-${i + 1}`}>
          <label className="group flex min-h-13 cursor-pointer items-center gap-3 rounded-[0.625rem] border-3 border-ink bg-white px-3.5 py-2 text-[1.1875rem] font-bold has-checked:opacity-55">
            <input
              type="checkbox"
              checked={ticked.has(i)}
              onChange={() => onToggle(i)}
              className="m-0 size-6 shrink-0 cursor-pointer appearance-none rounded-full border-3 border-ink bg-white checked:bg-jade checked:shadow-[inset_0_0_0_3px_#fff]"
            />
            <b className="min-w-14 font-black text-blu tabular-nums">{x.quantity_text}</b>
            <span>{x.name}</span>
          </label>
        </li>
      ))}
    </ul>
  );
}
