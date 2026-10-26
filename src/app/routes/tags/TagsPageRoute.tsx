import { data } from 'react-router';
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
import type { Route } from './+types/TagsPageRoute';
import type { ActionResult } from './lib/actionResult';

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
};
const refuse = (intent: string, { error, taken }: TagError) =>
  data({ intent, error: messages[error](taken), code: error, taken } satisfies ActionResult, { status: 400 });
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

export default function TagsPage({ loaderData }: Route.ComponentProps) {
  return (
    <main id="main" className="mx-auto max-w-3xl px-[max(1rem,4vw)] pt-6 pb-16">
      <h1 className="text-[clamp(2rem,6vw,3rem)] leading-[1.05] font-black tracking-[-0.03em]">Tags</h1>
      <p>{loaderData.tags.length}</p>
    </main>
  );
}
