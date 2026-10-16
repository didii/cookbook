import { useState } from 'react';
import type { StoredRecipe } from '~/lib/recipes';

type Props = { ingredients: StoredRecipe['ingredients'] };

export function IngredientList({ ingredients }: Props) {
  const [done, setDone] = useState<Set<number>>(new Set());

  const toggle = (i: number) =>
    setDone((prev) => {
      const next = new Set(prev);
      if (!next.delete(i)) next.add(i);
      return next;
    });

  return (
    <ul className="grid list-none gap-2 p-0">
      {ingredients.map((x, i) => (
        <li key={i}>
          <label className="group flex min-h-13 cursor-pointer items-center gap-3 rounded-[0.625rem] border-3 border-ink bg-white px-3.5 py-2 text-[1.1875rem] font-bold has-checked:bg-transparent has-checked:text-muted has-checked:line-through">
            <input
              type="checkbox"
              checked={done.has(i)}
              onChange={() => toggle(i)}
              className="m-0 size-6 shrink-0 cursor-pointer appearance-none rounded-full border-3 border-ink bg-white checked:bg-jade checked:shadow-[inset_0_0_0_3px_#fff]"
            />
            <b className="min-w-14 font-black text-blu tabular-nums group-has-checked:text-muted">{x.quantity_text}</b>
            <span>{x.name}</span>
          </label>
        </li>
      ))}
    </ul>
  );
}
