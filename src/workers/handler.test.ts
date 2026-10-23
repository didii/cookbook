import assert from 'node:assert/strict';
import { after, describe, test } from 'node:test';
import { generateKeyPair, SignJWT } from 'jose';
import type { RouterContextProvider } from 'react-router';
import { envContext, userEmailContext } from '~app/shared/context.server';
import { createUser } from '~app/shared/users.server';
import { createTestDb } from '~testing/db';
import { fake } from '~testing/fake';
import { createFetch } from './handler';
import { accessJwtHeader } from './identity';

// Typed string: the generated Env types these vars as the exact literals from wrangler.jsonc.
const teamDomain: string = 'team.cloudflareaccess.com';
const audience: string = 'aud-tag';
const { publicKey, privateKey } = await generateKeyPair('RS256');
const env = fake<Env & { DEV_USER_EMAIL: string }>({ ACCESS_TEAM_DOMAIN: teamDomain, ACCESS_AUD: audience, DEV_USER_EMAIL: 'dev@example.com' });

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

describe('family-access › Request with no identity proof', () => {
  test('is refused with 403', async () => {
    const res = await setup(false).fetch(get(), env);
    assert.equal(res.status, 403);
  });

  test('never reaches the app', async () => {
    const { calls, fetch } = setup(false);
    await fetch(get(), env);
    assert.equal(calls.length, 0);
  });
});

describe('createFetch', () => {
  describe('a bad token', () => {
    test('is refused with 403', async () => {
      const res = await setup(false).fetch(get('not-a-token'), env);
      assert.equal(res.status, 403);
    });

    test('never reaches the app', async () => {
      const { calls, fetch } = setup(false);
      await fetch(get('not-a-token'), env);
      assert.equal(calls.length, 0);
    });
  });

  describe('a valid token', () => {
    test('returns the response of the app', async () => {
      const res = await setup(false).fetch(get(await token()), env);
      assert.equal(await res.text(), 'app');
    });

    test('calls the app once', async () => {
      const { calls, fetch } = setup(false);
      await fetch(get(await token()), env);
      assert.equal(calls.length, 1);
    });

    test('puts the verified email in the context', async () => {
      const { calls, fetch } = setup(false);
      await fetch(get(await token()), env);
      assert.equal(calls[0].get(userEmailContext), 'mum@example.com');
    });

    test('puts the env in the context', async () => {
      const { calls, fetch } = setup(false);
      await fetch(get(await token()), env);
      assert.equal(calls[0].get(envContext), env);
    });
  });
});

describe('family-access › Local run with a stand-in member', () => {
  test('the request is let through', async () => {
    assert.equal((await setup(true).fetch(get(), env)).status, 200);
  });

  test('the stand-in email is in the context', async () => {
    const dev = setup(true);
    await dev.fetch(get(), env);
    assert.equal(dev.calls[0].get(userEmailContext), 'dev@example.com');
  });
});

describe('family-access › Stand-in identity configured on a deployed app', () => {
  test('is refused with 403', async () => {
    assert.equal((await setup(false).fetch(get(), env)).status, 403);
  });

  test('never reaches the app', async () => {
    const prod = setup(false);
    await prod.fetch(get(), env);
    assert.equal(prod.calls.length, 0);
  });
});

// A request without verified identity never reaches the app, so nothing that would store a user can run.
describe('users › Forged identity', () => {
  const forge = async () => {
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
    return { db, reached, res };
  };

  test('is refused with 403', async () => {
    assert.equal((await forge()).res.status, 403);
  });

  test('never reaches the app', async () => {
    assert.deepEqual((await forge()).reached, []);
  });

  test('stores nobody', async () => {
    const { db } = await forge();
    assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM users').first<{ n: number }>())?.n, 0);
  });
});

// Not automated: sign-in happens at Cloudflare Access, outside this code.
test.todo('family-access › Allowlisted member signs in');
test.todo('family-access › Unknown email is refused');
test.todo('family-access › Returning within the session period');
// Not automated: the home page needs a component or loader-level test.
test.todo('family-access › Home page shows who is signed in');
