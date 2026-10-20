/** The welcome screen's own address, which is never a place to return to. */
export const welcomePath = '/welkom';

const origin = 'http://cookbook.invalid';

/**
 * The page to go back to after the welcome screen, or `/` when the value is not a path of this site.
 * Browsers read `//host` and `/\host` as another site and drop tabs and newlines inside an address, so those are refused up front,
 * and the result must still resolve to this site when parsed.
 */
export function safeReturnUrl(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || [...value].some((c) => c === '\\' || c <= '\x1f' || c === '\x7f')) return '/';
  let url: URL;
  try {
    url = new URL(value, origin);
  } catch {
    return '/';
  }
  if (url.origin !== origin || url.pathname === welcomePath || url.pathname.startsWith(`${welcomePath}/`)) return '/';
  return value;
}
