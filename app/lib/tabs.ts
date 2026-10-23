export const tabs = [
  { id: 'ingredients', label: 'Ingrediënten' },
  { id: 'steps', label: 'Bereiding' },
] as const;

export type TabId = (typeof tabs)[number]['id'];

/** The tab named by a location hash (`#steps`), or undefined for any other hash. */
export function tabFromHash(hash: string): TabId | undefined {
  return tabs.find((t) => `#${t.id}` === hash)?.id;
}

/** The tab an arrow, Home or End key moves to, or undefined for any other key. Arrows wrap around. */
export function tabForKey(current: TabId, key: string): TabId | undefined {
  const i = tabs.findIndex((t) => t.id === current);
  const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[key];
  return to === undefined ? undefined : tabs[(to + tabs.length) % tabs.length].id;
}

/** The last scroll position of each tab while the stack was stuck, i.e. the page scrolled into the tab's content. Scrolling back up keeps it. */
export type Positions = Partial<Record<TabId, number>>;

/**
 * Where to scroll to when switching tabs, or undefined to stay where the page is:
 * - the new tab has a position: there;
 * - only the old tab has one (the page is scrolled into content the new tab does not have): the uppermost position with the stack stuck, the new tab's heading just under it;
 * - neither has one: nowhere, the tabs swap in place.
 */
export function arrive(positions: Positions, from: TabId, to: TabId, headingTop: number, stackHeight: number) {
  return positions[to] ?? (positions[from] === undefined ? undefined : Math.max(0, headingTop - stackHeight));
}
