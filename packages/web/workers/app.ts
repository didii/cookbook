import { createRemoteJWKSet, type JWTVerifyGetKey } from "jose";
import { createRequestHandler, RouterContextProvider } from "react-router";

import { userEmailContext } from "../app/context";
import { identify } from "../app/identity";

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

let jwks: JWTVerifyGetKey | undefined;

export default {
  async fetch(request, env) {
    const email = await identify(request, {
      teamDomain: env.ACCESS_TEAM_DOMAIN,
      audience: env.ACCESS_AUD,
      getKey: (header, token) =>
        (jwks ??= createRemoteJWKSet(
          new URL(`https://${env.ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`),
        ))(header, token),
      // Stand-in identity is compiled out of production builds.
      // Cast because DEV_USER_EMAIL is only in the generated Env when a local .dev.vars exists.
      devEmail: import.meta.env.DEV
        ? (env as { DEV_USER_EMAIL?: string }).DEV_USER_EMAIL
        : undefined,
    });
    if (!email) return new Response("Forbidden", { status: 403 });

    const context = new RouterContextProvider();
    context.set(userEmailContext, email);
    return requestHandler(request, context);
  },
} satisfies ExportedHandler<Env>;
