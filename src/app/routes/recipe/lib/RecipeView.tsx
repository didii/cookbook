import { Link, useRouteLoaderData } from 'react-router';
import { Fret, LikeButton, Pill } from '~app/shared/components';
import { filterParams } from '~app/shared/filterParams';
import { hoverUnderline } from '~app/shared/hover';
import { ChevronBack } from '~app/shared/icons';
import type { Recipe, Step } from '~app/shared/recipe';
import { RecipeActionsMenu } from './actions/RecipeActionsMenu';
import { CookSwitch } from './cook/CookSwitch';
import { IngredientList } from './IngredientList';
import { NotePanel } from './notes/NotePanel';
import { NoteSheet } from './notes/NoteSheet';
import { useNote } from './notes/useNote';
import { RecipeHead } from './RecipeHead';
import { ScaleControl } from './scale/ScaleControl';
import { StepList } from './StepList';
import { TabBar } from './tabs/TabBar';
import { TimerDock, TimersContext, TimerSidebar } from './timers';
import { useCooking } from './useCooking';

type Props = { recipe: Omit<Recipe, 'steps'>; tile: number; steps: Step[]; liked?: boolean; note?: string };

export function RecipeView({ recipe: r, tile, steps, liked = false, note: savedNote = '' }: Props) {
  const c = useCooking(r, steps);
  const { stack } = c;
  const email = useRouteLoaderData<{ email: string }>('root')?.email ?? '';
  const note = useNote(r.slug, savedNote, c.narrow, email);

  return (
    <TimersContext value={c.timers}>
      <main id="main" className="mx-auto max-w-272 px-[max(1rem,4vw)] pt-8 pb-16 max-[51.99rem]:pb-0">
        <div className="mb-2 flex items-center justify-between gap-4">
          <Link to="/" className={`inline-flex min-h-11 items-center gap-1 font-extrabold ${hoverUnderline}`}>
            <ChevronBack className="-ml-1.5" /> Alle recepten
          </Link>
          <div className="flex items-center gap-3.5">
            <LikeButton slug={r.slug} initialLiked={liked} />
            <RecipeActionsMenu slug={r.slug} />
          </div>
        </div>
        <RecipeHead recipe={r} tile={tile} />
        {r.tags.length > 0 && (
          <div data-testid="RecipeView-tags" className="mt-1.5 flex flex-wrap gap-1.5">
            {r.tags.map((name) => (
              <Link key={name} to={`/?${filterParams({ tags: [name] })}`} data-testid="RecipeView-tagLink" className="group inline-flex">
                <Pill data-testid="RecipeView-tag" className="inline-flex min-h-9 items-center bg-white text-base group-hover:bg-hover">
                  {name}
                </Pill>
              </Link>
            ))}
          </div>
        )}

        <CookSwitch wanted={c.wanted} lock={c.lock} manual={c.manual} onToggle={c.toggleCook} />

        <div className="mt-6 min-[52rem]:mt-10">
          <ScaleControl value={c.amount} onScaleChange={c.setAmount} servings={r.servings != null} />
        </div>

        <div
          ref={stack}
          data-testid="RecipeView-stack"
          className="sticky top-[env(safe-area-inset-top)] z-20 mt-6 -mx-[max(1rem,4vw)] min-[52rem]:hidden"
        >
          <TabBar tab={c.tab} onTabSelect={c.select} />
          <TimerDock timers={c.timers.active.filter((t) => !c.inView.has(t.step))} onJump={c.jump} />
        </div>

        <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-10 min-[52rem]:grid-cols-[minmax(16rem,22rem)_1fr] min-[52rem]:items-start">
          <section id="panel-ingredients" data-testid="RecipeView-ingredients" aria-labelledby="ing" className={c.panel('ingredients')}>
            <TimerSidebar timers={c.timers.active} onJump={c.jump} onPeek={c.setPeek} />
            <h2 id="ing" className="mb-4 scroll-mt-[calc(var(--stack-h,0px)+0.75rem)] text-2xl font-black">
              Ingrediënten
            </h2>
            <IngredientList ingredients={c.scaled.ingredients} ticked={c.ticked} onToggleIngredient={c.toggleTicked} />
            <NotePanel note={note} />
          </section>

          <section id="panel-steps" data-testid="RecipeView-steps" aria-labelledby="bereiding" className={c.panel('steps')}>
            <h2 id="bereiding" className="mb-4 scroll-mt-[calc(var(--stack-h,0px)+0.75rem)] text-2xl font-black">
              Bereiding
            </h2>
            <StepList steps={c.scaled.steps} highlight={c.flash} peek={c.peek} />
            <Fret size={18} className="mt-7 text-red" />
          </section>
        </div>
        <NoteSheet note={note} />
      </main>
    </TimersContext>
  );
}
