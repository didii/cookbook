import { useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import type { StoredRecipe } from '~/.server/recipes';
import type { Step } from '~/lib/steps';
import { arrive, leave, type Positions, type TabId } from '~/lib/tabs';
import { toggled } from '~/lib/toggled';
import { cn } from '~/shared/cn';
import { Fret } from '~/shared/Fret';
import { Seal } from '~/shared/Seal';
import { TileBand } from '~/shared/TileBand';
import { IngredientList } from './IngredientList';
import { StepList } from './StepList';
import { TabBar } from './TabBar';
import { useStackHeight } from './useStackHeight';

type Props = { recipe: StoredRecipe; tile: number; steps: Step[] };

export function RecipePage({ recipe: r, tile, steps }: Props) {
  const [tab, setTab] = useState<TabId>('ingredients');
  // Lives here, not in the list, because both tabs stay mounted and cook mode reads it.
  const [ticked, setTicked] = useState<ReadonlySet<number>>(new Set());

  const stack = useRef<HTMLDivElement>(null);
  const stackHeight = useStackHeight(stack);
  const positions = useRef<Positions>({});
  const arriving = useRef(false);

  const select = (next: TabId) => {
    if (next === tab) return;
    positions.current = leave(positions.current, tab, window.scrollY);
    arriving.current = true;
    setTab(next);
  };

  // Back where the tab was left; a tab not visited yet opens with its heading just under the stack.
  useLayoutEffect(() => {
    if (!arriving.current) return;
    arriving.current = false;
    const heading = document.getElementById(tab === 'ingredients' ? 'ing' : 'bereiding');
    if (!heading) return;
    const top = heading.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: arrive(positions.current, tab, top, stackHeight.current + 12), behavior: 'instant' });
  }, [tab, stackHeight]);

  // Below 52rem only the open tab shows, at least as tall as the screen under the stack, with the page's bottom padding inside it; from 52rem both show, side by side.
  const panel = (id: TabId) =>
    cn('min-w-0 max-[51.99rem]:min-h-[calc(100svh-var(--stack-h,3.5rem))] max-[51.99rem]:pb-16', tab !== id && 'max-[51.99rem]:hidden');

  return (
    <main id="main" className="mx-auto max-w-272 px-[max(1rem,4vw)] pt-8 pb-16 max-[51.99rem]:pb-0">
      <div className="mb-2 flex items-center justify-between gap-4">
        <Link to="/" className="inline-flex min-h-11 items-center font-extrabold underline-offset-[0.25em]">
          ← Alle recepten
        </Link>
        <Link to={`/recepten/${r.slug}/bewerken`} className="inline-flex min-h-11 items-center font-extrabold underline-offset-[0.25em]">
          Bewerk
        </Link>
      </div>
      <h1 className="text-[clamp(2rem,6vw,3.5rem)] leading-[1.05] font-black tracking-[-0.03em] text-balance">{r.title}</h1>
      <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 font-extrabold">
        <span className="rounded-full border-3 border-ink bg-yel px-3.5 py-0.5">van {r.author}</span>
        {r.time && <span>{r.time}</span>}
        {r.servings && <span>{r.servings} personen</span>}
      </p>
      <p className="mt-2 max-w-[60ch] text-lg text-muted">{r.intro}</p>

      <div className="@container relative mt-6 overflow-hidden rounded-xl border-3 border-ink bg-white shadow-hard">
        {r.image && <img src={r.image} alt="" width="1280" height="640" className="block aspect-2/1 w-full border-b-3 border-ink object-cover" />}
        {r.image && r.seal && <Seal id={r.seal} className="h-16" />}
        <TileBand first={tile} responsive className="border-b-0" />
      </div>

      <div ref={stack} className="sticky top-[env(safe-area-inset-top)] z-20 mt-6 -mx-[max(1rem,4vw)] min-[52rem]:hidden">
        <TabBar tab={tab} onSelect={select} />
      </div>

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-10 min-[52rem]:mt-10 min-[52rem]:grid-cols-[minmax(16rem,22rem)_1fr] min-[52rem]:items-start">
        <section
          id="panel-ingredients"
          aria-labelledby="ing"
          className={cn(
            panel('ingredients'),
            'min-[52rem]:sticky min-[52rem]:top-4 min-[52rem]:flex min-[52rem]:max-h-[calc(100svh-2rem)] min-[52rem]:flex-col',
          )}
        >
          <h2 id="ing" className="mb-4 shrink-0 scroll-mt-[calc(var(--stack-h,0px)+0.75rem)] text-2xl font-black">
            Ingrediënten
          </h2>
          <IngredientList
            ingredients={r.ingredients}
            ticked={ticked}
            onToggle={(i) => setTicked((prev) => toggled(prev, i))}
            className="min-[52rem]:min-h-0 min-[52rem]:flex-1 min-[52rem]:overflow-y-auto min-[52rem]:overscroll-contain min-[52rem]:pr-1 min-[52rem]:pb-1"
          />
        </section>

        <section id="panel-steps" aria-labelledby="bereiding" className={panel('steps')}>
          <h2 id="bereiding" className="mb-4 scroll-mt-[calc(var(--stack-h,0px)+0.75rem)] text-2xl font-black">
            Bereiding
          </h2>
          <StepList steps={steps} />
          <Fret size={18} className="mt-7 text-red" />
        </section>
      </div>
    </main>
  );
}
