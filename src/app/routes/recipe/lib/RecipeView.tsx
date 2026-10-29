import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { cn } from '~app/shared/cn';
import { Fret, LikeButton, Pill, Seal, TileBand } from '~app/shared/components';
import { filterParams } from '~app/shared/filterParams';
import { ChevronBack } from '~app/shared/icons';
import type { Recipe, Step } from '~app/shared/recipe';
import { initialCook, observe, setByHand, wantsCookMode } from './cook/cookMode';
import { CookSwitch } from './cook/CookSwitch';
import { useWakeLock } from './cook/useWakeLock';
import { IngredientList } from './IngredientList';
import { NotePanel } from './notes/NotePanel';
import { NoteSheet } from './notes/NoteSheet';
import { useNote } from './notes/useNote';
import { scaleIngredient, scaleText } from './scale/scale';
import { ScaleControl } from './scale/ScaleControl';
import { sourceLink } from './sourceLink';
import { StepList } from './StepList';
import { TabBar } from './tabs/TabBar';
import { arrive, tabFromHash, type Positions, type TabId } from './tabs/tabs';
import { TimerDock, TimersContext, TimerSidebar } from './timers';
import { ClockSetting } from './timers/ClockSetting';
import { useTimers } from './timers/useTimers';
import { toggled } from './toggled';
import { useNarrow } from './useNarrow';
import { useStackHeight } from './useStackHeight';
import { useStepsInView } from './useStepsInView';

type Props = { recipe: Omit<Recipe, 'steps'>; tile: number; steps: Step[]; liked?: boolean; note?: string };

export function RecipeView({ recipe: r, tile, steps, liked = false, note: savedNote = '' }: Props) {
  const [tab, setTab] = useState<TabId>('ingredients');
  // Lives here, not in the list, because both tabs stay mounted and cook mode reads it.
  const [ticked, setTicked] = useState<ReadonlySet<number>>(new Set());

  // The chosen servings (or multiplier without servings); not stored, so a reload starts at the recipe's own.
  const [amount, setAmount] = useState(r.servings ?? 1);
  const factor = r.servings ? amount / r.servings : amount;
  const scaled = useMemo(() => {
    return {
      ingredients: r.ingredients.map((x) => ({ ...x, quantityText: scaleIngredient(x, factor) })),
      steps: steps.map((s) => ({
        ...s,
        body: scaleText(s.body, s.quantities ?? [], factor),
        ingredients: s.ingredients.map((x) => ({ ...x, quantityText: scaleIngredient(x, factor) })),
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
  const note = useNote(r.slug, savedNote, narrow);
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
          <div className="flex items-center gap-3.5">
            <LikeButton slug={r.slug} initialLiked={liked} />
            <Link
              to={`/recepten/${r.slug}/bewerken`}
              state={{ fresh: true }}
              data-testid="RecipeView-edit"
              className="inline-flex min-h-11 items-center font-extrabold underline-offset-[0.25em] hover:underline"
            >
              Bewerk
            </Link>
          </div>
        </div>
        <h1 data-testid="RecipeView-title" className="text-[clamp(2rem,6vw,3.5rem)] leading-[1.05] font-black tracking-[-0.03em] text-balance">
          {r.title}
        </h1>
        <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 font-extrabold">
          <span data-testid="RecipeView-author" className="rounded-full border-3 border-ink bg-yel px-3.5 py-0.5">
            van {r.author}
          </span>
          {r.time && <span data-testid="RecipeView-time">{r.time}</span>}
          {r.servings && <span data-testid="RecipeView-servings">{r.servings} porties</span>}
          {r.source && <Source source={r.source} />}
        </p>
        <p className="mt-2 max-w-[60ch] text-lg text-muted">{r.intro}</p>

        <div className="@container relative mt-6 overflow-hidden rounded-xl border-3 border-ink bg-white shadow-hard">
          {r.image && (
            <img
              data-testid="RecipeView-image"
              src={r.image}
              alt=""
              width="1280"
              height="640"
              className="block aspect-2/1 w-full border-b-3 border-ink object-cover"
            />
          )}
          {r.image && r.seal && <Seal sealId={r.seal} className="h-16" />}
          <TileBand first={tile} rows={r.image ? 1 : 3} responsive className="border-b-0" />
        </div>
        {r.tags.length > 0 && (
          <div data-testid="RecipeView-tags" className="mt-1.5 flex flex-wrap gap-1.5">
            {r.tags.map((name) => (
              <Link key={name} to={`/?${filterParams({ tags: [name] })}`} data-testid="RecipeView-tagLink">
                <Pill data-testid="RecipeView-tag">{name}</Pill>
              </Link>
            ))}
          </div>
        )}

        <ClockSetting />
        <CookSwitch wanted={wanted} lock={lock} manual={cook.manual} onToggle={() => setCook((c) => setByHand(c, !wantsCookMode(c, true)))} />

        <div className="mt-6 min-[52rem]:mt-10">
          <ScaleControl value={amount} onScaleChange={setAmount} servings={r.servings != null} />
        </div>

        <div
          ref={stack}
          data-testid="RecipeView-stack"
          className="sticky top-[env(safe-area-inset-top)] z-20 mt-6 -mx-[max(1rem,4vw)] min-[52rem]:hidden"
        >
          <TabBar tab={tab} onTabSelect={select} />
          <TimerDock timers={timers.active.filter((t) => !inView.has(t.step))} onJump={jump} />
        </div>

        <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-10 min-[52rem]:grid-cols-[minmax(16rem,22rem)_1fr] min-[52rem]:items-start">
          <section id="panel-ingredients" data-testid="RecipeView-ingredients" aria-labelledby="ing" className={panel('ingredients')}>
            <TimerSidebar timers={timers.active} onJump={jump} onPeek={setPeek} />
            <h2 id="ing" className="mb-4 scroll-mt-[calc(var(--stack-h,0px)+0.75rem)] text-2xl font-black">
              Ingrediënten
            </h2>
            <IngredientList ingredients={scaled.ingredients} ticked={ticked} onToggleIngredient={(i) => setTicked((prev) => toggled(prev, i))} />
            <NotePanel note={note} />
          </section>

          <section id="panel-steps" data-testid="RecipeView-steps" aria-labelledby="bereiding" className={panel('steps')}>
            <h2 id="bereiding" className="mb-4 scroll-mt-[calc(var(--stack-h,0px)+0.75rem)] text-2xl font-black">
              Bereiding
            </h2>
            <StepList steps={scaled.steps} highlight={flash} peek={peek} />
            <Fret size={18} className="mt-7 text-red" />
          </section>
        </div>
        <NoteSheet note={note} />
      </main>
    </TimersContext>
  );
}

type SourceProps = { source: string };

/** Where the recipe came from: a link to the address when the source is a web address, otherwise the text. */
function Source({ source }: SourceProps) {
  const link = sourceLink(source);
  return link ? (
    <a data-testid="RecipeView-source" href={link.href} target="_blank" rel="noopener noreferrer" className="underline">
      {link.text}
    </a>
  ) : (
    <span data-testid="RecipeView-source">{source}</span>
  );
}
