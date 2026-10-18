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

/**
 * Remember where the tab being left was scrolled to, but only when the stack was stuck, i.e. the page was scrolled into the tab's content.
 * Higher up there is no position worth coming back to.
 */
export const leave = (positions: Positions, tab: TabId, scrollY: number, stuck: boolean): Positions => ({
  ...positions,
  [tab]: stuck ? scrollY : undefined,
});

/**
 * Where to scroll to on arriving at a tab, or undefined to stay where the page is. Only a stuck stack scrolls: to where the tab was left, or
 * on a first visit with its heading just under the stack. Above that the tabs swap in place, like tabs anywhere on the web.
 */
export const arrive = (positions: Positions, tab: TabId, headingTop: number, stackHeight: number, stuck: boolean) =>
  stuck ? (positions[tab] ?? Math.max(0, headingTop - stackHeight)) : undefined;
