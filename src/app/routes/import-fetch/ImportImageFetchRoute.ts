import type { Route } from './+types/ImportImageFetchRoute';
import { handleImport } from './lib/handleImport.server';
import { imageBytes, isImage } from './lib/safeFetch.server';

/** POST /importeren/foto with `{ url }`: the JPEG, PNG or WebP image at that address (up to 2 MB), or a status without body. */
export function action({ request, context }: Route.ActionArgs) {
  return handleImport(request, context, { maxBytes: imageBytes, accept: isImage });
}
