import { createRemoteJWKSet, type JWTVerifyGetKey } from 'jose';
import { RouterContextProvider } from 'react-router';
import { envContext, userEmailContext } from '~app/shared/context.server';
import { identify } from './identity';

type Options = {
  requestHandler: (request: Request, context: RouterContextProvider) => Response | Promise<Response>;
  /** Honor the DEV_USER_EMAIL stand-in identity. Pass false in production builds. */
  dev: boolean;
  /** Key lookup for verifying the Access token. Defaults to the team's published keys. */
  getKey?: JWTVerifyGetKey;
};

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

/** The Worker's fetch: verify who is asking, then hand the request to the app with who and what bindings. */
export function createFetch({ requestHandler, dev, getKey }: Options) {
  let jwks: JWTVerifyGetKey | undefined;

  const handle = async (request: Request, env: Env) => {
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

    const context = new RouterContextProvider();
    context.set(userEmailContext, email);
    context.set(envContext, env);
    return requestHandler(request, context);
  };

  return async (request: Request, env: Env) => withSecurityHeaders(await handle(request, env));
}
