import { jwtVerify, type JWTVerifyGetKey } from "jose";

export interface IdentityOptions {
  /** Zero Trust team domain, e.g. "myteam.cloudflareaccess.com" */
  teamDomain: string;
  /** Audience (AUD) tag of the Access application */
  audience: string;
  getKey: JWTVerifyGetKey;
  /** Stand-in member for local development. Callers must only pass this in dev builds. */
  devEmail?: string;
}

/** Returns the verified email of the signed-in member, or null if there is none. */
export async function identify(
  request: Request,
  { teamDomain, audience, getKey, devEmail }: IdentityOptions,
): Promise<string | null> {
  const token = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!token) return devEmail || null;
  // jose skips the audience check when given an empty value, so fail closed on missing config
  if (!teamDomain || !audience) return null;
  try {
    const { payload } = await jwtVerify(token, getKey, {
      issuer: `https://${teamDomain}`,
      audience,
      algorithms: ["RS256"],
    });
    return typeof payload.email === "string" && payload.email
      ? payload.email
      : null;
  } catch {
    return null;
  }
}
