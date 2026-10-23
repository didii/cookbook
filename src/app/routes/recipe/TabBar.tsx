import type { KeyboardEvent } from 'react';
import { tabForKey, tabs, type TabId } from '~app/lib/tabs';

type Props = { tab: TabId; onSelect: (tab: TabId) => void };

/** Ingrediënten / Bereiding switch for narrow screens; the panels it controls stay mounted. */
export function TabBar({ tab, onSelect }: Props) {
  const onKeyDown = (e: KeyboardEvent) => {
    const next = tabForKey(tab, e.key);
    if (!next) return;
    e.preventDefault();
    onSelect(next);
    document.getElementById(`tab-${next}`)?.focus();
  };

  return (
    <div data-testid="TabBar-list" role="tablist" aria-label="Recept" className="flex gap-2 border-b-3 border-ink bg-por px-[max(1rem,4vw)] py-2">
      {tabs.map((t) => (
        <button
          key={t.id}
          id={`tab-${t.id}`}
          data-testid="TabBar-tab"
          type="button"
          role="tab"
          aria-selected={tab === t.id}
          aria-controls={`panel-${t.id}`}
          tabIndex={tab === t.id ? 0 : -1}
          onClick={() => onSelect(t.id)}
          onKeyDown={onKeyDown}
          className="min-h-10 flex-1 cursor-pointer rounded-[0.625rem] border-3 border-ink bg-white px-2 text-[1.0625rem] font-black aria-selected:bg-red aria-selected:text-white aria-selected:shadow-hard-sm"
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
