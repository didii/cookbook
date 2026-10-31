import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { cn } from '~app/shared/cn';
import type { Recipe, Step } from '~app/shared/recipe';
import { initialCook, observe, setByHand, wantsCookMode } from './cook/cookMode';
import { useWakeLock } from './cook/useWakeLock';
import { scaleIngredient, scaleText } from './scale/scale';
import { arrive, tabFromHash, type Positions, type TabId } from './tabs/tabs';
import { useTimers } from './timers/useTimers';
import { toggled } from './toggled';
import { useNarrow } from './useNarrow';
import { useStackHeight } from './useStackHeight';
import { useStepsInView } from './useStepsInView';

/** The page state of a recipe view: tabs, ticks, servings, timers, jumping to a step, cook mode and scroll positions. Holds nothing about the member. */
export function useCooking(r: Pick<Recipe, 'slug' | 'servings' | 'ingredients'>, steps: Step[]) {
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

  return {
    tab,
    select,
    ticked,
    toggleTicked: (i: number) => setTicked((prev) => toggled(prev, i)),
    amount,
    setAmount,
    scaled,
    timers,
    stack,
    inView,
    flash,
    jump,
    narrow,
    wanted,
    lock,
    manual: cook.manual,
    toggleCook: () => setCook((c) => setByHand(c, !wantsCookMode(c, true))),
    peek,
    setPeek,
    panel,
  };
}
