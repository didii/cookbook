import { envContext, userEmailContext } from '~app/shared/context.server';
import { setLike } from '~app/shared/recipes.server';
import { getUser } from '~app/shared/users.server';
import type { Route } from './+types/LikeUpdateRoute';

/** POST /recepten/:slug/favoriet with `liked=true|false`: states the wanted value, so a repeat cannot flip it. Answers 204, 400 (other value), 403 (no user row) or 404 (unknown recipe). */
export async function action({ request, params, context }: Route.ActionArgs) {
  const liked = (await request.formData()).get('liked');
  if (liked !== 'true' && liked !== 'false') return new Response(null, { status: 400 });
  const { DB } = context.get(envContext);
  const email = context.get(userEmailContext);
  if (!(await getUser(DB, email))) return new Response(null, { status: 403 });
  return new Response(null, { status: (await setLike(DB, email, params.slug, liked === 'true')) ? 204 : 404 });
}
