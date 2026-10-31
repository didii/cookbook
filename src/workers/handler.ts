import { createRemoteJWKSet, type JWTVerifyGetKey } from 'jose';
import { RouterContextProvider } from 'react-router';
import { envContext, importAllowContext, publicRequestContext, userEmailContext } from '~app/shared/context.server';
import { identify } from './identity';

type Options = {
  requestHandler: (request: Request, context: RouterContextProvider) => Response | Promise<Response>;
  /** Honor the DEV_USER_EMAIL stand-in identity. Pass false in production builds. */
  dev: boolean;
  /** Key lookup for verifying the Access token. Defaults to the team's published keys. */
  getKey?: JWTVerifyGetKey;
  /** Where public pages are kept for a minute. Defaults to the Worker's own cache (none where there is no `caches`). */
  cache?: Pick<Cache, 'match' | 'put'>;
};

/** The part of the Worker's execution context that the fetch uses. */
type Ctx = Pick<ExecutionContext, 'waitUntil'>;

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'same-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), payment=(), usb=()',
};

/** A copy of the response with the security headers it lacks. */
function withSecurityHeaders(res: Response) {
  const headers = new Headers(res.headers);
  for (const [name, value] of Object.entries(securityHeaders)) if (!headers.has(name)) headers.set(name, value);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

/** True for a data-changing request that a browser says comes from another origin. */
function isCrossOrigin(request: Request) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return false;
  const origin = request.headers.get('Origin');
  if (origin !== null) return origin !== new URL(request.url).origin;
  return request.headers.get('Sec-Fetch-Site') === 'cross-site';
}

/**
 * The only requests that need no identity: a GET or HEAD for the public page of a recipe (`/share/<one segment>`, with or without the `.data` suffix of
 * React Router's data requests) or for a stored photo (`/foto/<one segment>`). Keep this narrow: it is the one place that opens the app to anyone.
 */
export function isPublicRequest(request: Request) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return false;
  return /^\/(share|foto)\/[^/]+$/.test(new URL(request.url).pathname);
}

const isSharePath = (request: Request) => new URL(request.url).pathname.startsWith('/share/');

/** The Worker's fetch: verify who is asking, then hand the request to the app with who and what bindings. */
export function createFetch({ requestHandler, dev, getKey, cache }: Options) {
  let jwks: JWTVerifyGetKey | undefined;

  const handle = async (request: Request, env: Env) => {
    if (isPublicRequest(request)) {
      // No identity is asked for and none is passed on: a loader that wants the member fails instead of leaking.
      const context = new RouterContextProvider();
      context.set(publicRequestContext, true);
      context.set(envContext, env);
      return requestHandler(request, context);
    }

    const email = await identify(request, {
      teamDomain: env.ACCESS_TEAM_DOMAIN,
      audience: env.ACCESS_AUD,
      getKey:
        getKey ??
        ((header, token) => (jwks ??= createRemoteJWKSet(new URL(`https://${env.ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`)))(header, token)),
      // Cast because DEV_USER_EMAIL is only in the generated Env when a local .dev.vars exists.
      devEmail: dev ? (env as { DEV_USER_EMAIL?: string }).DEV_USER_EMAIL : undefined,
    });
    if (!email) return new Response('Forbidden', { status: 403 });

    if (isCrossOrigin(request)) return new Response('Forbidden', { status: 403 });

    const context = new RouterContextProvider();
    context.set(userEmailContext, email);
    context.set(envContext, env);
    context.set(importAllowContext, async (key) => (await env.IMPORT_LIMITER.limit({ key })).success);
    return requestHandler(request, context);
  };

  return async (request: Request, env: Env, ctx?: Ctx) => {
    const store = cache ?? (typeof caches === 'undefined' ? undefined : (caches as unknown as { default: Cache }).default);
    // A public page is kept for a minute so a spike of visits does not reach the database. A removed link can live that long.
    const cacheable = store !== undefined && request.method === 'GET' && isPublicRequest(request) && isSharePath(request);
    if (cacheable) {
      const hit = await store.match(request);
      if (hit) return hit;
    }
    const res = withSecurityHeaders(await handle(request, env));
    if (isSharePath(request)) res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    if (cacheable && res.status === 200) {
      res.headers.set('Cache-Control', 'public, max-age=60');
      const put = store.put(request, res.clone());
      if (ctx) ctx.waitUntil(put);
      else await put;
    }
    return res;
  };
}
