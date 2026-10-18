export const tabs = [
  { id: 'ingredients', label: 'Ingrediënten' },
  { id: 'steps', label: 'Bereiding' },
] as const;

export type TabId = (typeof tabs)[number]['id'];

/** The tab named by a location hash (`#steps`), or undefined for any other hash. */
export const tabFromHash = (hash: string): TabId | undefined => tabs.find((t) => `#${t.id}` === hash)?.id;

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

/**
 * Where to scroll to on arriving at a tab: where it was left, but never above its heading just under the sticky stack. A position above that
 * was left before scrolling into the tab, so it points at nothing in it (and a tab not visited yet has none).
 */
export const arrive = (positions: Positions, tab: TabId, headingTop: number, stackHeight: number) =>
  Math.max(positions[tab] ?? 0, headingTop - stackHeight, 0);
