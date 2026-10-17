import assert from 'node:assert/strict';
import { test } from 'node:test';
import { generateKeyPair, SignJWT } from 'jose';
import type { RouterContextProvider } from 'react-router';
import { envContext, userEmailContext } from '~/lib/context';
import { createFetch } from './handler';

// Typed string: the generated Env types these vars as the exact literals from wrangler.jsonc.
const teamDomain: string = 'team.cloudflareaccess.com';
const audience: string = 'aud-tag';
const { publicKey, privateKey } = await generateKeyPair('RS256');
const env = { ACCESS_TEAM_DOMAIN: teamDomain, ACCESS_AUD: audience, DEV_USER_EMAIL: 'dev@example.com' } as Partial<Env> as Env;

const token = () =>
  new SignJWT({ email: 'mum@example.com' })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuer(`https://${teamDomain}`)
    .setAudience(audience)
    .setExpirationTime('1h')
    .sign(privateKey);

/** A fetch whose app records the contexts it was called with. */
function setup(dev: boolean) {
  const calls: RouterContextProvider[] = [];
  const fetch = createFetch({
    requestHandler: (_request, context) => (calls.push(context), new Response('app')),
    dev,
    getKey: async () => publicKey,
  });
  return { calls, fetch };
}

const get = (jwt?: string) => new Request('https://cookbook.example.com/', { headers: jwt ? { 'Cf-Access-Jwt-Assertion': jwt } : {} });

test('refuses a request without identity and never reaches the app', async () => {
  const { calls, fetch } = setup(false);
  const res = await fetch(get(), env);
  assert.equal(res.status, 403);
  assert.equal(calls.length, 0);
});

test('refuses a bad token and never reaches the app', async () => {
  const { calls, fetch } = setup(false);
  const res = await fetch(get('not-a-token'), env);
  assert.equal(res.status, 403);
  assert.equal(calls.length, 0);
});

test('passes the app its response, with the verified email and the env in the context', async () => {
  const { calls, fetch } = setup(false);
  const res = await fetch(get(await token()), env);
  assert.equal(await res.text(), 'app');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].get(userEmailContext), 'mum@example.com');
  assert.equal(calls[0].get(envContext), env);
});

test('honors the stand-in email only in dev', async () => {
  const dev = setup(true);
  assert.equal((await dev.fetch(get(), env)).status, 200);
  assert.equal(dev.calls[0].get(userEmailContext), 'dev@example.com');

  const prod = setup(false);
  assert.equal((await prod.fetch(get(), env)).status, 403);
  assert.equal(prod.calls.length, 0);
});
