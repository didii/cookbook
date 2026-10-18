export const tabs = [
  { id: 'ingredients', label: 'Ingrediënten' },
  { id: 'steps', label: 'Bereiding' },
] as const;

export type TabId = (typeof tabs)[number]['id'];

/** The tab an arrow, Home or End key moves to, or undefined for any other key. Arrows wrap around. */
export function tabForKey(current: TabId, key: string): TabId | undefined {
  const i = tabs.findIndex((t) => t.id === current);
  const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[key];
  return to === undefined ? undefined : tabs[(to + tabs.length) % tabs.length].id;
}

/** Scroll positions of the tabs that have been left. */
export type Positions = Partial<Record<TabId, number>>;

/** Remember where the tab being left was scrolled to. */
export const leave = (positions: Positions, tab: TabId, scrollY: number): Positions => ({ ...positions, [tab]: scrollY });

/** Where to scroll to on arriving at a tab: where it was left, or, on a first visit, with its heading just under the sticky stack. */
export const arrive = (positions: Positions, tab: TabId, headingTop: number, stackHeight: number) =>
  positions[tab] ?? Math.max(0, headingTop - stackHeight);
