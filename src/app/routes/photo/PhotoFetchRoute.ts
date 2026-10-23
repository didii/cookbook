import { envContext } from '~app/shared/context.server';
import { getPhoto } from '~app/shared/photos.server';
import type { Route } from './+types/PhotoFetchRoute';

/** GET /foto/:file: the stored photo, cached for a year because the name changes whenever the photo does. */
export async function loader({ params, context }: Route.LoaderArgs) {
  const photo = await getPhoto(context.get(envContext).PHOTOS, params.file);
  if (!photo) return new Response(null, { status: 404 });
  return new Response(photo.body, {
    headers: {
      'Content-Type': photo.httpMetadata?.contentType ?? 'application/octet-stream',
      'Cache-Control': 'private, max-age=31536000, immutable',
      ETag: photo.httpEtag,
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
