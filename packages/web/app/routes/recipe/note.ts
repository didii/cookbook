import { envContext, userEmailContext } from '~/.server/context';
import { setNote } from '~/.server/recipes';
import { getUser } from '~/.server/users';
import { maxNoteLength } from '~/lib/note';
import type { Route } from './+types/note';

/** POST /recepten/:slug/notitie with `note=<text>`. Answers 204, 400 (no text field), 403 (no user row), 404 (unknown recipe) or 413 (too long). */
export async function action({ request, params, context }: Route.ActionArgs) {
  // Cheap refusal before the body is read: a note of maxNoteLength characters is at most 4 bytes each, 3 characters when percent-encoded.
  if (Number(request.headers.get('Content-Length')) > maxNoteLength * 12 + 16) return new Response(null, { status: 413 });
  const note = (await request.formData()).get('note');
  if (typeof note !== 'string') return new Response(null, { status: 400 });
  if (note.length > maxNoteLength) return new Response(null, { status: 413 });
  const { DB } = context.get(envContext);
  const email = context.get(userEmailContext);
  if (!(await getUser(DB, email))) return new Response(null, { status: 403 });
  return new Response(null, { status: (await setNote(DB, email, params.slug, note)) ? 204 : 404 });
}
