import { redirect } from 'react-router';
import { isWelcomePath, welcomePath } from '~/lib/returnUrl';
import { getUser } from './users';

/** A redirect to the welcome screen, remembering the requested page and query, for a member without a user row asking for any other page; otherwise nothing. */
export async function redirectToWelcome(db: D1Database, email: string, url: URL): Promise<Response | undefined> {
  if (isWelcomePath(url.pathname) || (await getUser(db, email))) return undefined;
  return redirect(`${welcomePath}?${new URLSearchParams({ returnUrl: url.pathname + url.search })}`);
}
