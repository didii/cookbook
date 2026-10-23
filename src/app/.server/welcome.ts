import { redirect } from 'react-router';
import { isWelcomePath, welcomePath } from '~app/lib/returnUrl';
import type { User } from './users';

/** A redirect to the welcome screen, remembering the requested page and query, for a member without a user row (`user` is undefined) asking for any other page; otherwise nothing. */
export function redirectToWelcome(user: User | undefined, url: URL): Response | undefined {
  const page = pageOf(url);
  if (isWelcomePath(page.pathname) || user) return undefined;
  return redirect(`${welcomePath}?${new URLSearchParams({ returnUrl: page.pathname + page.search })}`);
}

/** The page behind a client-side navigation's data request (`/x.data`, `/_root.data` for the home page), so those are not mistaken for pages of their own. */
function pageOf(url: URL): URL {
  const page = new URL(url);
  if (!page.pathname.endsWith('.data')) return page;
  page.pathname = page.pathname.slice(0, -'.data'.length).replace(/^\/_root$/, '/');
  page.searchParams.delete('_routes');
  return page;
}
