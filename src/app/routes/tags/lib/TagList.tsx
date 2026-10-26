import type { ReactNode } from 'react';
import { Button, Pill } from '~app/shared/components';
import type { TagGroup, TagOrder } from './arrangeTags';
import { TagForm } from './TagForm';
import { TagRow } from './TagRow';

interface TagListProps {
  groups: TagGroup[];
  order: TagOrder;
  /** How many tags are stored, whatever the filters leave. */
  total: number;
  /** Every stored tag name (for merging) and category (for suggestions). */
  names: string[];
  categories: string[];
  openName: string | null;
  onOpenChange: (name: string | null) => void;
  selecting: boolean;
  selection: ReadonlySet<string>;
  onToggle: (name: string) => void;
  onClearFilters: () => void;
  /** A form saved: the answer's confirmation. */
  onDone: (message: string) => void;
}

/** The rows, by name or under a heading per category, with the form of the open row below it. */
export function TagList({
  groups,
  order,
  total,
  names,
  categories,
  openName,
  onOpenChange,
  selecting,
  selection,
  onToggle,
  onClearFilters,
  onDone,
}: TagListProps) {
  if (total === 0)
    return (
      <p data-testid="TagList-none" className="mt-4 rounded-[0.625rem] border-3 border-ink bg-white px-4 py-6 text-center font-bold text-muted">
        Er zijn nog geen tags. Ze worden gemaakt in de receptbewerker.
      </p>
    );
  if (groups.length === 0)
    return (
      <div className="mt-4 flex flex-col items-center gap-2 rounded-[0.625rem] border-3 border-ink bg-white px-4 py-6">
        <p data-testid="TagList-noMatch" className="text-lg font-black">
          Geen tags gevonden
        </p>
        <Button type="button" data-testid="TagList-clear" className="min-h-11 flex-none px-4 text-base" onClick={onClearFilters}>
          Wis filters
        </Button>
      </div>
    );
  return (
    <ul aria-label="Tags" className="mt-2 m-0 list-none overflow-clip rounded-[0.625rem] border-3 border-ink bg-white p-0">
      {groups.map((group) => (
        <GroupItems key={group.category ?? ''} group={group} heading={order === 'category'}>
          {group.tags.map((tag) => (
            <TagRow
              key={tag.name}
              tag={tag}
              showCategory={order === 'name'}
              open={openName === tag.name && !selecting}
              selecting={selecting}
              selected={selection.has(tag.name)}
              onActivate={() => (selecting ? onToggle(tag.name) : onOpenChange(openName === tag.name ? null : tag.name))}
            >
              <TagForm key={tag.name} tag={tag} names={names} categories={categories} onClose={() => onOpenChange(null)} onDone={onDone} />
            </TagRow>
          ))}
        </GroupItems>
      ))}
    </ul>
  );
}

type GroupItemsProps = { group: TagGroup; heading: boolean; children: ReactNode };

function GroupItems({ group, heading, children }: GroupItemsProps) {
  return (
    <>
      {heading && (
        <li
          role="presentation"
          data-testid="TagList-heading"
          className="flex items-baseline justify-between gap-3 border-t-3 border-ink bg-por px-3 py-2 font-black first:border-t-0"
        >
          <Pill
            variant={group.category ? 'category' : 'dashed'}
            data-testid="TagList-category"
            className="text-[0.9375rem] font-black whitespace-nowrap"
          >
            {group.category ?? 'Zonder categorie'}
          </Pill>
          <span data-testid="TagList-groupCount" className="text-[0.9375rem] font-extrabold text-muted">
            {group.tags.length}
          </span>
        </li>
      )}
      {children}
    </>
  );
}
