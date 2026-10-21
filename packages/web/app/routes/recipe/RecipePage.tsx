import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { initialCook, observe, setByHand, wantsCookMode } from '~/lib/cookMode';
import type { Recipe, Step } from '~/lib/recipe';
import { scaleBody, scaleQuantity } from '~/lib/scale';
import { arrive, tabFromHash, type Positions, type TabId } from '~/lib/tabs';
import { toggled } from '~/lib/toggled';
import { cn } from '~/shared/cn';
import { Fret } from '~/shared/Fret';
import { ChevronBack } from '~/shared/icons';
import { Seal } from '~/shared/Seal';
import { TileBand } from '~/shared/TileBand';
import { ClockSetting } from './ClockSetting';
import { CookSwitch } from './CookSwitch';
import { IngredientList } from './IngredientList';
import { ScaleControl } from './ScaleControl';
import { StepList } from './StepList';
import { TabBar } from './TabBar';
import { TimerDock } from './TimerDock';
import { TimersContext } from './timersContext';
import { TimerSidebar } from './TimerSidebar';
import { useNarrow } from './useNarrow';
import { useStackHeight } from './useStackHeight';
import { useStepsInView } from './useStepsInView';
import { useTimers } from './useTimers';
import { useWakeLock } from './useWakeLock';

type Props = { recipe: Omit<Recipe, 'steps'>; tile: number; steps: Step[] };

export function RecipePage({ recipe: r, tile, steps }: Props) {
  const [tab, setTab] = useState<TabId>('ingredients');
  // Lives here, not in the list, because both tabs stay mounted and cook mode reads it.
  const [ticked, setTicked] = useState<ReadonlySet<number>>(new Set());

  // The chosen servings (or multiplier without servings); not stored, so a reload starts at the recipe's own.
  const [amount, setAmount] = useState(r.servings ?? 1);
  const factor = r.servings ? amount / r.servings : amount;
  const scaled = useMemo(() => {
    const rows = r.ingredients.map((x, i) => ({ id: String(i), ...x }));
    return {
      ingredients: r.ingredients.map((x) => ({ ...x, quantityText: scaleQuantity(x.quantityText, factor) })),
      steps: steps.map((s) => ({
        ...s,
        body: scaleBody(s.body, factor, rows),
        ingredients: s.ingredients.map((x) => ({ ...x, quantityText: scaleQuantity(x.quantityText, factor) })),
      })),
    };
  }, [r.ingredients, steps, factor]);

  const timers = useTimers(r.slug, steps);
  const stack = useRef<HTMLDivElement>(null);
  const stackHeight = useStackHeight(stack);
  const inView = useStepsInView(stack, steps.length);
  const positions = useRef<Positions>({});
  const leaving = useRef<TabId>(undefined);

  const select = (next: TabId) => {
    if (next === tab) return;
    leaving.current = tab;
    setTab(next);
    // Keeps the router's history state; a reload then opens the same tab.
    history.replaceState(history.state, '', `#${next}`);
  };

  // The server renders the first tab; the hash is only known in the browser.
  useEffect(() => {
    const fromHash = tabFromHash(location.hash);
    // oxlint-disable-next-line react/set-state-in-effect -- the hash may only be read after hydration
    if (fromHash) setTab(fromHash);
  }, []);

  // The stack is stuck to the top of the screen once the page is scrolled into the tab's content: that is where the open tab's position is kept.
  useEffect(() => {
    const keep = () => {
      if ((stack.current?.getBoundingClientRect().top ?? 1) <= 0.5) positions.current[tab] = window.scrollY;
    };
    window.addEventListener('scroll', keep, { passive: true });
    return () => window.removeEventListener('scroll', keep);
  }, [tab]);

  // Where the page goes on switching tabs: see `arrive`.
  useLayoutEffect(() => {
    const from = leaving.current;
    leaving.current = undefined;
    if (from === undefined) return;
    const heading = document.getElementById(tab === 'ingredients' ? 'ing' : 'bereiding');
    if (!heading) return;
    const top = heading.getBoundingClientRect().top + window.scrollY;
    const to = arrive(positions.current, from, tab, top, stackHeight.current + 12);
    if (to !== undefined) window.scrollTo({ top: to, behavior: 'instant' });
  }, [tab, stackHeight]);

  // Going to the step of a timer: scroll to it and highlight it for three seconds. `n` makes a repeated jump restart the highlight.
  const [flash, setFlash] = useState<{ step: number; n: number }>();
  const jump = (step: number) => {
    // Below 52rem the steps may be on the closed tab.
    if (!window.matchMedia('(min-width: 52rem)').matches) select('steps');
    setFlash((f) => ({ step, n: (f?.n ?? 0) + 1 }));
  };
  useEffect(() => {
    if (!flash) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById(`step-${flash.step + 1}`)?.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'start' });
    const timeout = setTimeout(() => setFlash(undefined), 3100);
    return () => clearTimeout(timeout);
  }, [flash]);
  // Cook mode: starts by itself once cooking has started (the open tab's first item is past the middle of the screen, or an ingredient is ticked)
  // until the switch is used. Narrow screens only.
  const narrow = useNarrow();
  const [cook, setCook] = useState(initialCook);
  const tickedCount = ticked.size;
  useEffect(() => {
    const look = () => {
      const first = document.getElementById(tab === 'steps' ? 'step-1' : 'ingredient-1');
      if (first)
        setCook((c) => observe(c, { firstItemTop: first.getBoundingClientRect().top, viewportHeight: window.innerHeight, ticked: tickedCount }));
    };
    // oxlint-disable-next-line react/set-state-in-effect -- reads the layout, which only exists in the browser
    look();
    window.addEventListener('scroll', look, { passive: true });
    return () => window.removeEventListener('scroll', look);
  }, [tab, tickedCount]);
  const wanted = wantsCookMode(cook, narrow);
  const lock = useWakeLock(wanted);

  // The step whose sidebar card the mouse is over gets a light tint.
  const [peek, setPeek] = useState<number>();

  // Below 52rem only the open tab shows, at least as tall as the screen under the stack, with the page's bottom padding inside it; from 52rem both show, side by side.
  const panel = (id: TabId) =>
    cn('min-w-0 max-[51.99rem]:min-h-[calc(100svh-var(--stack-h,3.5rem))] max-[51.99rem]:pb-16', tab !== id && 'max-[51.99rem]:hidden');

  return (
    <TimersContext value={timers}>
      <main id="main" className="mx-auto max-w-272 px-[max(1rem,4vw)] pt-8 pb-16 max-[51.99rem]:pb-0">
        <div className="mb-2 flex items-center justify-between gap-4">
          <Link to="/" className="inline-flex min-h-11 items-center gap-1 font-extrabold underline-offset-[0.25em] hover:underline">
            <ChevronBack className="-ml-1.5" /> Alle recepten
          </Link>
          <Link
            to={`/recepten/${r.slug}/bewerken`}
            state={{ fresh: true }}
            className="inline-flex min-h-11 items-center font-extrabold underline-offset-[0.25em] hover:underline"
          >
            Bewerk
          </Link>
        </div>
        <h1 className="text-[clamp(2rem,6vw,3.5rem)] leading-[1.05] font-black tracking-[-0.03em] text-balance">{r.title}</h1>
        <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 font-extrabold">
          <span className="rounded-full border-3 border-ink bg-yel px-3.5 py-0.5">van {r.author}</span>
          {r.time && <span>{r.time}</span>}
          <ScaleControl value={amount} onChange={setAmount} servings={r.servings != null} />
        </p>
        <p className="mt-2 max-w-[60ch] text-lg text-muted">{r.intro}</p>

        <div className="@container relative mt-6 overflow-hidden rounded-xl border-3 border-ink bg-white shadow-hard">
          {r.image && <img src={r.image} alt="" width="1280" height="640" className="block aspect-2/1 w-full border-b-3 border-ink object-cover" />}
          {r.image && r.seal && <Seal id={r.seal} className="h-16" />}
          <TileBand first={tile} responsive className="border-b-0" />
        </div>

        <ClockSetting />
        <CookSwitch wanted={wanted} lock={lock} manual={cook.manual} onToggle={() => setCook((c) => setByHand(c, !wantsCookMode(c, true)))} />

        <div ref={stack} className="sticky top-[env(safe-area-inset-top)] z-20 mt-6 -mx-[max(1rem,4vw)] min-[52rem]:hidden">
          <TabBar tab={tab} onSelect={select} />
          <TimerDock timers={timers.active.filter((t) => !inView.has(t.step))} onJump={jump} />
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
            <TimerSidebar timers={timers.active} onJump={jump} onPeek={setPeek} />
            <h2 id="ing" className="mb-4 shrink-0 scroll-mt-[calc(var(--stack-h,0px)+0.75rem)] text-2xl font-black">
              Ingrediënten
            </h2>
            <IngredientList
              ingredients={scaled.ingredients}
              ticked={ticked}
              onToggle={(i) => setTicked((prev) => toggled(prev, i))}
              className="min-[52rem]:min-h-0 min-[52rem]:flex-1 min-[52rem]:overflow-y-auto min-[52rem]:overscroll-contain min-[52rem]:pr-1 min-[52rem]:pb-1"
            />
          </section>

          <section id="panel-steps" aria-labelledby="bereiding" className={panel('steps')}>
            <h2 id="bereiding" className="mb-4 scroll-mt-[calc(var(--stack-h,0px)+0.75rem)] text-2xl font-black">
              Bereiding
            </h2>
            <StepList steps={scaled.steps}highlight={flash} peek={peek} />
            <Fret size={18} className="mt-7 text-red" />
          </section>
        </div>
      </main>
    </TimersContext>
  );
}
