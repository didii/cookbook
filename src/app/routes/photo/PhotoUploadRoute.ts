import { envContext } from '~app/.server/context';
import { maxPhotoBytes, storePhoto } from '~app/.server/photos';
import type { Route } from './+types/upload';

/** POST /foto: the request body is the image. Answers `{ path }`, or 413 (too large) / 415 (not a JPEG, PNG or WebP). */
export async function action({ request, context }: Route.ActionArgs) {
  // Cheap refusal first; the real size is checked again after reading, because the header can lie.
  if (Number(request.headers.get('Content-Length')) > maxPhotoBytes) return new Response(null, { status: 413 });
  const stored = await storePhoto(context.get(envContext).PHOTOS, await request.arrayBuffer());
  return 'path' in stored ? Response.json(stored) : new Response(null, { status: stored.status });
}
