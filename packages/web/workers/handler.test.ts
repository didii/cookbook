import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createTestDb } from '~testing/db';
import { generateKeyPair, SignJWT } from 'jose';
import type { RouterContextProvider } from 'react-router';
import { envContext, userEmailContext } from '~/.server/context';
import { accessJwtHeader } from '~/.server/identity';
import { createUser } from '~/.server/users';
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

const get = (jwt?: string) => new Request('https://cookbook.example.com/', { headers: jwt ? { [accessJwtHeader]: jwt } : {} });

test('family-access › Request with no identity proof', async () => {
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

test('family-access › Local run with a stand-in member', async () => {
  const dev = setup(true);
  assert.equal((await dev.fetch(get(), env)).status, 200);
  assert.equal(dev.calls[0].get(userEmailContext), 'dev@example.com');
});

test('family-access › Stand-in identity configured on a deployed app', async () => {
  const prod = setup(false);
  assert.equal((await prod.fetch(get(), env)).status, 403);
  assert.equal(prod.calls.length, 0);
});

// A request without verified identity never reaches the app, so nothing that would store a user can run.
test('users › Forged identity', async () => {
  const { db, dispose } = await createTestDb();
  after(dispose);
  const reached: string[] = [];
  const fetch = createFetch({
    requestHandler: async (_request, context) => (
      await createUser(db, context.get(userEmailContext), 'Nep'),
      reached.push('app'),
      new Response('app')
    ),
    dev: false,
    getKey: async () => publicKey,
  });
  const res = await fetch(get('forged'), { ...env, DB: db });
  assert.equal(res.status, 403);
  assert.deepEqual(reached, []);
  assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM users').first<{ n: number }>())?.n, 0);
});

// Not automated: sign-in happens at Cloudflare Access, outside this code.
test.todo('family-access › Allowlisted member signs in');
test.todo('family-access › Unknown email is refused');
test.todo('family-access › Returning within the session period');
// Not automated: the home page needs a component or loader-level test.
test.todo('family-access › Home page shows who is signed in');
