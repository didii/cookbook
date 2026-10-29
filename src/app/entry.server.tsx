import { isbot } from 'isbot';
import { renderToReadableStream } from 'react-dom/server';
import type { EntryContext, RouterContextProvider } from 'react-router';
import { ServerRouter } from 'react-router';

export const streamTimeout = 5_000;

/** A new random nonce (128 bits, base64) for one response. */
export function createNonce() {
  return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
}

/** The Content-Security-Policy of a page whose inline scripts carry `nonce`. */
export function contentSecurityPolicy(nonce: string) {
  return [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}'`,
    // Inline styles: React `style` attributes are blocked without it.
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src https://fonts.gstatic.com`,
    `img-src 'self' data: blob:`,
    `connect-src 'self'`,
    `manifest-src 'self'`,
    `worker-src 'self'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
  ].join('; ');
}

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  _loadContext: RouterContextProvider,
) {
  const nonce = createNonce();
  responseHeaders.set('Content-Security-Policy', contentSecurityPolicy(nonce));

  // https://httpwg.org/specs/rfc9110.html#HEAD
  if (request.method.toUpperCase() === 'HEAD') {
    return new Response(null, { status: responseStatusCode, headers: responseHeaders });
  }

  let shellRendered = false;
  const userAgent = request.headers.get('user-agent');

  const body = await renderToReadableStream(<ServerRouter context={routerContext} url={request.url} nonce={nonce} />, {
    signal: AbortSignal.timeout(streamTimeout + 1000),
    nonce,
    onError(error: unknown) {
      responseStatusCode = 500;
      // Errors from inside the shell are logged by handleDocumentRequest already.
      if (shellRendered) console.error(error);
    },
  });
  shellRendered = true;

  // Bots and SPA mode wait for all content.
  if ((userAgent && isbot(userAgent)) || routerContext.isSpaMode) await body.allReady;

  responseHeaders.set('Content-Type', 'text/html');
  return new Response(body, { headers: responseHeaders, status: responseStatusCode });
}
