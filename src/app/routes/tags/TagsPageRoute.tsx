import { useCallback, useEffect, useState } from 'react';
import { data } from 'react-router';
import { cn } from '~app/shared/cn';
import { envContext } from '~app/shared/context.server';
import {
  addTag,
  deleteTag,
  listCategories,
  listManagedTags,
  mergeTag,
  normalizeName,
  saveTag,
  setCategory,
  type TagError,
} from '~app/shared/tagManagement.server';
import { sortTags } from '~app/shared/tags';
import type { Route } from './+types/TagsPageRoute';
import type { ActionResult } from './lib/actionResult';
import { AddTagForm } from './lib/AddTagForm';
import { arrangeTags, type TagFilters } from './lib/arrangeTags';
import { Filters } from './lib/Filters';
import { SelectionBar } from './lib/SelectionBar';
import { TagList } from './lib/TagList';

export async function loader({ context }: Route.LoaderArgs) {
  const db = context.get(envContext).DB;
  const [tags, categories] = await Promise.all([listManagedTags(db), listCategories(db)]);
  return { tags, categories };
}

const messages = {
  empty: () => 'Geef de tag een naam.',
  tooLong: () => 'Dit is te lang: maximaal 100 tekens.',
  taken: (taken?: string) => `De tag “${taken}” bestaat al.`,
  notFound: () => 'Deze tag bestaat niet meer. Laad de pagina opnieuw.',
  same: () => 'Een tag kan niet met zichzelf worden samengevoegd.',
};
const refuse = (intent: string, { error, taken, field }: TagError) =>
  data({ intent, error: messages[error](taken), code: error, taken, field } satisfies ActionResult, { status: 400 });
const plural = (n: number) => (n === 1 ? '1 tag' : `${n} tags`);

/** One action for every form of the page; `intent` says which. Errors answer the form with a 400 instead of throwing, so what was typed stays. */
export async function action({ request, context }: Route.ActionArgs) {
  const db = context.get(envContext).DB;
  const form = await request.formData();
  const text = (key: string) => String(form.get(key) ?? '');
  const intent = text('intent');
  const done = (message: string) => data({ done: message } satisfies ActionResult);
  switch (intent) {
    case 'add': {
      const result = await addTag(db, text('name'));
      return 'error' in result ? refuse(intent, result) : done(`Tag “${normalizeName(text('name'))}” toegevoegd.`);
    }
    case 'save': {
      const result = await saveTag(db, text('current'), { name: text('name'), category: text('category') });
      return 'error' in result ? refuse(intent, result) : done('Opgeslagen.');
    }
    case 'merge': {
      const result = await mergeTag(db, text('from'), text('into'));
      return 'error' in result ? refuse(intent, result) : done(`Samengevoegd met “${text('into')}”.`);
    }
    case 'delete': {
      const result = await deleteTag(db, text('name'));
      return 'error' in result ? refuse(intent, result) : done(`Tag “${text('name')}” verwijderd.`);
    }
    case 'bulk': {
      const result = await setCategory(db, form.getAll('name').map(String), text('category'));
      return 'error' in result ? refuse(intent, result) : done(`${plural(result.changed)} aangepast.`);
    }
    default:
      throw data('Onbekende actie.', { status: 400 });
  }
}

export function meta() {
  return [{ title: 'Tags · Familiekookboek' }];
}

const noFilters: TagFilters = { q: '', unused: false, withoutCategory: false, order: 'name' };

export default function TagsPage({ loaderData }: Route.ComponentProps) {
  const { tags, categories } = loaderData;
  const [filters, setFilters] = useState<TagFilters>(noFilters);
  const [openName, setOpenName] = useState<string | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [selection, setSelection] = useState<ReadonlySet<string>>(new Set());
  const [confirmation, setConfirmation] = useState('');
  const groups = arrangeTags(tags, filters);
  const shown = groups.flatMap((g) => g.tags);

  useEffect(() => {
    if (!confirmation) return;
    const timer = setTimeout(() => setConfirmation(''), 4000);
    return () => clearTimeout(timer);
  }, [confirmation]);

  // These go to forms that call them from an effect, so they keep their identity.
  const formDone = useCallback((message: string) => {
    setOpenName(null);
    setConfirmation(message);
  }, []);
  const added = useCallback((message: string) => {
    // The new tag must show, whatever the filters were.
    setFilters((f) => ({ ...noFilters, order: f.order }));
    setConfirmation(message);
  }, []);
  const categorySet = useCallback((message: string) => {
    setSelection(new Set());
    setConfirmation(message);
  }, []);

  const toggle = (name: string) =>
    setSelection((current) => {
      const next = new Set(current);
      if (!next.delete(name)) next.add(name);
      return next;
    });

  return (
    <main id="main" className={cn('mx-auto max-w-3xl px-[max(1rem,4vw)] pt-6', selecting ? 'pb-48' : 'pb-16')}>
      <h1 data-testid="TagsPage-title" className="text-[clamp(2rem,6vw,3rem)] leading-[1.05] font-black tracking-[-0.03em]">
        Tags
      </h1>
      <p className="mt-2 text-lg text-muted">Houd de labels van je recepten netjes: hernoem, voeg samen of ruim op.</p>
      <div className="mt-5">
        <AddTagForm onDone={added} />
      </div>
      <Filters
        filters={filters}
        onChange={setFilters}
        selecting={selecting}
        onSelectingChange={(on) => {
          setSelecting(on);
          setOpenName(null);
          if (!on) setSelection(new Set());
        }}
        shown={shown.length}
        total={tags.length}
      />
      <TagList
        groups={groups}
        order={filters.order}
        total={tags.length}
        names={sortTags(tags.map((t) => t.name))}
        categories={categories}
        openName={openName}
        onOpenChange={setOpenName}
        selecting={selecting}
        selection={selection}
        onToggle={toggle}
        onClearFilters={() => setFilters((f) => ({ ...noFilters, order: f.order }))}
        onDone={formDone}
      />
      {selecting && (
        <SelectionBar
          selected={[...selection]}
          categories={categories}
          onSelectAll={() => setSelection(new Set(shown.map((t) => t.name)))}
          onSelectNone={() => setSelection(new Set())}
          onDone={categorySet}
        />
      )}
      {confirmation && (
        <output
          data-testid="TagsPage-confirmation"
          className="fixed inset-x-0 bottom-28 z-30 mx-auto w-fit max-w-[calc(100%-2rem)] rounded-[0.625rem] border-3 border-ink bg-jade px-4 py-2.5 font-extrabold text-white shadow-hard-sm"
        >
          {confirmation}
        </output>
      )}
    </main>
  );
}
