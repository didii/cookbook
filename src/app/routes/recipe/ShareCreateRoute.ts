import { envContext, userEmailContext } from '~app/shared/context.server';
import { getOrCreateShare } from '~app/shared/shares.server';
import { getUser } from '~app/shared/users.server';
import type { Route } from './+types/ShareCreateRoute';

/** POST /recepten/:slug/delen: the member's share of the recipe, created when there is none. Answers JSON `{ token, expiresAt, created }` (`created`: this call made the share), 403 (no user row) or 404 (unknown recipe). */
export async function action({ params, context }: Route.ActionArgs) {
  const { DB } = context.get(envContext);
  const email = context.get(userEmailContext);
  if (!(await getUser(DB, email))) return new Response(null, { status: 403 });
  const share = await getOrCreateShare(DB, email, params.slug);
  return share ? Response.json(share) : new Response(null, { status: 404 });
}
