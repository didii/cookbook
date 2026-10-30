import assert from 'node:assert/strict';
import { generateKeyPair, SignJWT } from 'jose';
import type { RouterContextProvider } from 'react-router';
import { describe } from 'vitest';
import { loader as fetchPhoto } from '~app/routes/photo/PhotoFetchRoute';
import { envContext, importAllowContext, userEmailContext } from '~app/shared/context.server';
import { storePhoto } from '~app/shared/photos.server';
import { createUser } from '~app/shared/users.server';
import { fake } from '~testing/fake';
import { test } from '~testing/test';
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

    test('puts the import rate limit in the context', async () => {
      const { calls, fetch } = setup(false);
      const keys: string[] = [];
      const limiter = { limit: async ({ key }: { key: string }) => (keys.push(key), { success: false }) };
      await fetch(get(await token()), { ...env, IMPORT_LIMITER: limiter });
      assert.equal(await calls[0].get(importAllowContext)('mum@example.com'), false);
      assert.deepEqual(keys, ['mum@example.com']);
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
    const dev = setup(true);
    await dev.fetch(get(), env);
    assert.equal(dev.calls.length, 1);
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
  const forge = async (db: D1Database) => {
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
    return { reached, res: await fetch(get('forged'), { ...env, DB: db }) };
  };

  test('is refused with 403', async ({ db }) => {
    assert.equal((await forge(db)).res.status, 403);
  });

  test('never reaches the app', async ({ db }) => {
    assert.deepEqual((await forge(db)).reached, []);
  });

  test('stores nobody', async ({ db }) => {
    await forge(db);
    assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM users').first<{ n: number }>())?.n, 0);
  });
});

const staticHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'same-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), payment=(), usb=()',
};

const assertHeaders = (res: Response) => {
  for (const [name, value] of Object.entries(staticHeaders)) assert.equal(res.headers.get(name), value, name);
};

describe('security-headers › A page has the headers', () => {
  test('has the four headers', async () => {
    assertHeaders(await setup(false).fetch(get(await token()), env));
  });
});

describe('security-headers › A refusal has the headers', () => {
  test('has the four headers', async () => {
    const res = await setup(false).fetch(get(), env);
    assert.equal(res.status, 403);
    assertHeaders(res);
  });
});

describe('security-headers › A header the response already has is kept', () => {
  const answering = (headers: Record<string, string>) =>
    createFetch({ requestHandler: () => new Response('app', { headers }), dev: false, getKey: async () => publicKey });

  test('keeps both headers once each', async () => {
    const res = await answering({ 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, max-age=31536000, immutable' })(
      get(await token()),
      env,
    );
    assert.equal(res.headers.get('X-Content-Type-Options'), 'nosniff');
    assert.equal(res.headers.get('Cache-Control'), 'private, max-age=31536000, immutable');
  });

  test('keeps a value that differs from the default', async () => {
    const res = await answering({ 'X-Frame-Options': 'SAMEORIGIN' })(get(await token()), env);
    assert.equal(res.headers.get('X-Frame-Options'), 'SAMEORIGIN');
  });
});

describe('security-headers › A photo has the headers', () => {
  const served = async (photos: R2Bucket) => {
    const stored = await storePhoto(photos, new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1]).buffer);
    assert.ok('path' in stored);
    const fetch = createFetch({
      requestHandler: (_request, context) =>
        fetchPhoto(fake<Parameters<typeof fetchPhoto>[0]>({ params: { file: stored.path.slice('/foto/'.length) }, context })) as Promise<Response>,
      dev: false,
      getKey: async () => publicKey,
    });
    return fetch(get(await token()), { ...env, PHOTOS: photos });
  };

  test('has the four headers', async ({ photos }) => {
    assertHeaders(await served(photos));
  });

  test('keeps its Content-Type', async ({ photos }) => {
    assert.equal((await served(photos)).headers.get('Content-Type'), 'image/jpeg');
  });
});

const post = async (url: string, headers: Record<string, string>, method = 'POST') =>
  new Request(url, { method, headers: { [accessJwtHeader]: await token(), ...headers } });
const page = 'https://cookbook.example.com/recepten/nieuw';

/** Sends the request and tells whether it was refused with 403 without reaching the app. */
async function refused(request: Request) {
  const { calls, fetch } = setup(false);
  const res = await fetch(request, env);
  return res.status === 403 && calls.length === 0;
}

describe('same-origin-requests › Same-origin post is accepted', () => {
  test('the app handles it', async () => {
    const { calls, fetch } = setup(false);
    await fetch(await post(page, { Origin: 'https://cookbook.example.com' }), env);
    assert.equal(calls.length, 1);
  });
});

describe('same-origin-requests › Other origin is refused', () => {
  test('is refused with 403 and the app is not reached', async () => {
    assert.equal(await refused(await post(page, { Origin: 'https://evil.example.org' })), true);
  });
});

describe('same-origin-requests › Origin that differs only in scheme or port is refused', () => {
  test('another scheme is refused', async () => {
    assert.equal(await refused(await post('https://cookbook.example.com/x', { Origin: 'http://cookbook.example.com' })), true);
  });

  test('another port is refused', async () => {
    assert.equal(await refused(await post('https://cookbook.example.com/x', { Origin: 'https://cookbook.example.com:8443' })), true);
  });
});

describe('same-origin-requests › Null origin is refused', () => {
  test('is refused with 403', async () => {
    assert.equal(await refused(await post(page, { Origin: 'null' })), true);
  });
});

describe('same-origin-requests › Cross-site post without an origin is refused', () => {
  test('is refused with 403', async () => {
    assert.equal(await refused(await post(page, { 'Sec-Fetch-Site': 'cross-site' })), true);
  });
});

describe('same-origin-requests › Every data-changing method is covered', () => {
  for (const method of ['PUT', 'PATCH', 'DELETE']) {
    test(`${method} is refused with 403`, async () => {
      assert.equal(await refused(await post(page, { Origin: 'https://evil.example.org' }, method)), true);
    });
  }
});

describe('same-origin-requests › Post without browser headers is accepted', () => {
  test('the app handles it', async () => {
    const { calls, fetch } = setup(false);
    await fetch(await post(page, {}), env);
    assert.equal(calls.length, 1);
  });
});

describe('same-origin-requests › Reading is not restricted', () => {
  test('a GET with a foreign origin is handled', async () => {
    const { calls, fetch } = setup(false);
    await fetch(await post(page, { Origin: 'https://evil.example.org' }, 'GET'), env);
    assert.equal(calls.length, 1);
  });

  test('a HEAD with Sec-Fetch-Site cross-site is handled', async () => {
    const { calls, fetch } = setup(false);
    await fetch(await post(page, { 'Sec-Fetch-Site': 'cross-site' }, 'HEAD'), env);
    assert.equal(calls.length, 1);
  });
});

describe('same-origin-requests › The refusal has the security headers', () => {
  test('has the four headers', async () => {
    const res = await setup(false).fetch(await post(page, { Origin: 'https://evil.example.org' }), env);
    assert.equal(res.status, 403);
    assertHeaders(res);
  });
});

describe('recipe-import › Not a family member', () => {
  for (const path of ['/importeren/pagina', '/importeren/foto']) {
    test(`${path} is refused with 403 and never reaches the app`, async () => {
      const { calls, fetch } = setup(false);
      const res = await fetch(new Request(`https://cookbook.example.com${path}`, { method: 'POST', body: '{"url":"https://example.com/"}' }), env);
      assert.equal(res.status, 403);
      assert.equal(calls.length, 0);
    });
  }
});

// Not automated: sign-in happens at Cloudflare Access, outside this code.
test.todo('family-access › Allowlisted member signs in');
test.todo('family-access › Unknown email is refused');
test.todo('family-access › Returning within the session period');
// Not automated: the home page needs a component or loader-level test.
test.todo('family-access › Home page shows who is signed in');
