import type { RouterContextProvider } from 'react-router';
import { importAllowContext, userEmailContext } from '~app/shared/context.server';
import { safeFetch } from './safeFetch.server';

export const maxAddressLength = 2000;

type Options = { maxBytes: number; accept: (mediaType: string) => boolean };

/** The address in a body of exactly `{ url }`, or undefined. */
async function readAddress(request: Request) {
  const body: unknown = await request.json().catch(() => undefined);
  if (typeof body !== 'object' || body === null || Array.isArray(body) || Object.keys(body).length !== 1) return undefined;
  const { url } = body as { url?: unknown };
  return typeof url === 'string' && url.length > 0 && url.length <= maxAddressLength ? url : undefined;
}

/** Shared body of both import endpoints: check the body, rate limit the member, fetch safely, answer the bytes or a status without body. */
export async function handleImport(request: Request, context: Readonly<RouterContextProvider>, { maxBytes, accept }: Options) {
  if (!(await context.get(importAllowContext)(context.get(userEmailContext))))
    return new Response(null, { status: 429, headers: { 'Retry-After': '60' } });
  const address = await readAddress(request);
  if (!address) return new Response(null, { status: 400 });
  const fetched = await safeFetch(address, { maxBytes, accept });
  if (!fetched.ok) return new Response(null, { status: fetched.status });
  return new Response(fetched.body, {
    // Fetched pages are other people's HTML: sandboxed and never sniffed, so a form post to this address cannot run their scripts here.
    headers: {
      'Content-Type': fetched.contentType,
      'Content-Security-Policy': 'sandbox',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store',
    },
  });
}
