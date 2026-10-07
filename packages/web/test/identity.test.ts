import assert from "node:assert/strict";
import { test } from "node:test";
import { generateKeyPair, SignJWT } from "jose";

import { identify } from "../app/identity.ts";

const teamDomain = "team.cloudflareaccess.com";
const audience = "aud-tag";
const { publicKey, privateKey } = await generateKeyPair("RS256");
const other = await generateKeyPair("RS256");
const options = { teamDomain, audience, getKey: async () => publicKey };

function token({
  key = privateKey,
  aud = audience,
  exp = "1h" as string | number,
  claims = { email: "mum@example.com" } as Record<string, unknown>,
} = {}) {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "RS256" })
    .setIssuer(`https://${teamDomain}`)
    .setAudience(aud)
    .setExpirationTime(exp)
    .sign(key);
}

const request = (jwt?: string, headers: Record<string, string> = {}) =>
  new Request("https://cookbook.example.com/", {
    headers: jwt ? { ...headers, "Cf-Access-Jwt-Assertion": jwt } : headers,
  });

test("valid token returns the email", async () => {
  assert.equal(await identify(request(await token()), options), "mum@example.com");
});

test("missing token is refused", async () => {
  assert.equal(await identify(request(), options), null);
});

test("email header without a token is refused", async () => {
  const forged = request(undefined, {
    "Cf-Access-Authenticated-User-Email": "mum@example.com",
  });
  assert.equal(await identify(forged, options), null);
});

test("bad signature is refused", async () => {
  const jwt = await token({ key: other.privateKey });
  assert.equal(await identify(request(jwt), options), null);
});

test("wrong audience is refused", async () => {
  const jwt = await token({ aud: "someone-else" });
  assert.equal(await identify(request(jwt), options), null);
});

test("expired token is refused", async () => {
  const jwt = await token({ exp: Math.floor(Date.now() / 1000) - 60 });
  assert.equal(await identify(request(jwt), options), null);
});

test("token without an email claim is refused", async () => {
  const jwt = await token({ claims: {} });
  assert.equal(await identify(request(jwt), options), null);
});

test("missing Access config is refused even with a valid token", async () => {
  const jwt = await token();
  assert.equal(await identify(request(jwt), { ...options, audience: "" }), null);
  assert.equal(await identify(request(jwt), { ...options, teamDomain: "" }), null);
});

test("stand-in email is honored only when passed in", async () => {
  assert.equal(
    await identify(request(), { ...options, devEmail: "dev@example.com" }),
    "dev@example.com",
  );
  assert.equal(await identify(request(), { ...options, devEmail: undefined }), null);
});
