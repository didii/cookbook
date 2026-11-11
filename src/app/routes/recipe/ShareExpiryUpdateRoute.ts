import { envContext, userEmailContext } from '~app/shared/context.server';
import { isExpiryChoice } from '~app/shared/shareExpiry';
import { setShareExpiry } from '~app/shared/shares.server';
import type { Route } from './+types/ShareExpiryUpdateRoute';

/** POST /recepten/:slug/delen/verloop with `expires` (one of the six choices): sets the end date of the member's own live share, counted from now. Answers JSON `{ expiresAt }`, 400 (other choice) or 404 (the member has no live share of the recipe). */
export async function action({ request, params, context }: Route.ActionArgs) {
  const expires = (await request.formData()).get('expires');
  if (!isExpiryChoice(expires)) return new Response(null, { status: 400 });
  const share = await setShareExpiry(context.get(envContext).DB, context.get(userEmailContext), params.slug, expires);
  return share ? Response.json(share) : new Response(null, { status: 404 });
}
