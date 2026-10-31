import { Fret, Pill } from '~app/shared/components';
import type { Recipe, Step } from '~app/shared/recipe';
import { CookSwitch } from './cook/CookSwitch';
import { IngredientList } from './IngredientList';
import { RecipeHead } from './RecipeHead';
import { ScaleControl } from './scale/ScaleControl';
import { StepList } from './StepList';
import { TabBar } from './tabs/TabBar';
import { headingIds, panelClass } from './tabs/tabs';
import { TimerDock, TimersContext, TimerSidebar } from './timers';
import { useCooking } from './useCooking';

type Props = { recipe: Omit<Recipe, 'steps' | 'id' | 'updated_at'>; tile: number; steps: Step[] };

/** The recipe for anyone with its address: the recipe page without navigation, like, actions menu, notes and tag links. Takes no member data. */
export function SharedRecipeView({ recipe: r, tile, steps }: Props) {
  const c = useCooking(r, steps);
  const { stack } = c;

  return (
    <TimersContext value={c.timers}>
      <main id="main" className="mx-auto max-w-272 px-[max(1rem,4vw)] pt-8 pb-16 max-[51.99rem]:pb-0">
        <RecipeHead recipe={r} tile={tile} />
        {r.tags.length > 0 && (
          <div data-testid="SharedRecipeView-tags" className="mt-1.5 flex flex-wrap gap-1.5">
            {r.tags.map((name) => (
              <Pill key={name} data-testid="SharedRecipeView-tag" className="inline-flex min-h-9 items-center bg-white text-base">
                {name}
              </Pill>
            ))}
          </div>
        )}

        <CookSwitch wanted={c.wanted} lock={c.lock} manual={c.manual} onToggle={c.toggleCook} />

        <div className="mt-6 min-[52rem]:mt-10">
          <ScaleControl value={c.amount} onScaleChange={c.setAmount} servings={r.servings != null} />
        </div>

        <div ref={stack} className="sticky top-[env(safe-area-inset-top)] z-20 mt-6 -mx-[max(1rem,4vw)] min-[52rem]:hidden">
          <TabBar tab={c.tab} onTabSelect={c.select} />
          <TimerDock timers={c.timers.active.filter((t) => !c.inView.has(t.step))} onJump={c.jump} />
        </div>

        <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-10 min-[52rem]:grid-cols-[minmax(16rem,22rem)_1fr] min-[52rem]:items-start">
          <section
            id="panel-ingredients"
            data-testid="SharedRecipeView-ingredients"
            aria-labelledby={headingIds.ingredients}
            className={panelClass(c.tab, 'ingredients')}
          >
            <TimerSidebar timers={c.timers.active} onJump={c.jump} onPeek={c.setPeek} />
            <h2 id={headingIds.ingredients} className="mb-4 scroll-mt-[calc(var(--stack-h,0px)+0.75rem)] text-2xl font-black">
              Ingrediënten
            </h2>
            <IngredientList ingredients={c.scaled.ingredients} ticked={c.ticked} onToggleIngredient={c.toggleTicked} />
          </section>

          <section id="panel-steps" data-testid="SharedRecipeView-steps" aria-labelledby={headingIds.steps} className={panelClass(c.tab, 'steps')}>
            <h2 id={headingIds.steps} className="mb-4 scroll-mt-[calc(var(--stack-h,0px)+0.75rem)] text-2xl font-black">
              Bereiding
            </h2>
            <StepList steps={c.scaled.steps} highlight={c.flash} peek={c.peek} />
            <Fret size={18} className="mt-7 text-red" />
          </section>
        </div>
      </main>
    </TimersContext>
  );
}
