import type { Route } from './+types/ImportPageFetchRoute';
import { handleImport } from './lib/handleImport.server';
import { isHtml, pageBytes } from './lib/safeFetch.server';

/** POST /importeren/pagina with `{ url }`: the HTML of that page (up to 5 MB), or a status without body. */
export function action({ request, context }: Route.ActionArgs) {
  return handleImport(request, context, { maxBytes: pageBytes, accept: isHtml });
}
