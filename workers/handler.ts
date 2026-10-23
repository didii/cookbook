import { createRemoteJWKSet, type JWTVerifyGetKey } from 'jose';
import { RouterContextProvider } from 'react-router';
import { envContext, userEmailContext } from '~/.server/context';
import { identify } from '~/.server/identity';

type Options = {
  requestHandler: (request: Request, context: RouterContextProvider) => Response | Promise<Response>;
  /** Honor the DEV_USER_EMAIL stand-in identity. Pass false in production builds. */
  dev: boolean;
  /** Key lookup for verifying the Access token. Defaults to the team's published keys. */
  getKey?: JWTVerifyGetKey;
};

/** The Worker's fetch: verify who is asking, then hand the request to the app with who and what bindings. */
export function createFetch({ requestHandler, dev, getKey }: Options) {
  let jwks: JWTVerifyGetKey | undefined;

  return async (request: Request, env: Env) => {
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
}
