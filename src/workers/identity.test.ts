import assert from 'node:assert/strict';
import { generateKeyPair, SignJWT } from 'jose';
import { describe, test } from 'vitest';
import { accessJwtHeader, identify } from './identity';

const teamDomain = 'team.cloudflareaccess.com';
const audience = 'aud-tag';
const { publicKey, privateKey } = await generateKeyPair('RS256');
const other = await generateKeyPair('RS256');
const options = { teamDomain, audience, getKey: async () => publicKey };

function token({
  key = privateKey,
  aud = audience,
  exp = '1h' as string | number,
  claims = { email: 'mum@example.com' } as Record<string, unknown>,
} = {}) {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuer(`https://${teamDomain}`)
    .setAudience(aud)
    .setExpirationTime(exp)
    .sign(key);
}

const request = (jwt?: string, headers: Record<string, string> = {}) =>
  new Request('https://cookbook.example.com/', {
    headers: jwt ? { ...headers, [accessJwtHeader]: jwt } : headers,
  });

describe('identify', () => {
  test('a valid token returns the email', async () => {
    assert.equal(await identify(request(await token()), options), 'mum@example.com');
  });

  describe('family-access › Request with no identity proof', () => {
    test('returns null', async () => {
      assert.equal(await identify(request(), options), null);
    });
  });

  describe('family-access › Forged identity', () => {
    test('an email header without a token returns null', async () => {
      const forged = request(undefined, {
        'Cf-Access-Authenticated-User-Email': 'mum@example.com',
      });
      assert.equal(await identify(forged, options), null);
    });
  });

  test('a bad signature is refused', async () => {
    const jwt = await token({ key: other.privateKey });
    assert.equal(await identify(request(jwt), options), null);
  });

  test('a wrong audience is refused', async () => {
    const jwt = await token({ aud: 'someone-else' });
    assert.equal(await identify(request(jwt), options), null);
  });

  describe('family-access › Expired identity proof', () => {
    test('returns null', async () => {
      const jwt = await token({ exp: Math.floor(Date.now() / 1000) - 60 });
      assert.equal(await identify(request(jwt), options), null);
    });
  });

  test('a token without an email claim is refused', async () => {
    const jwt = await token({ claims: {} });
    assert.equal(await identify(request(jwt), options), null);
  });

  describe('missing Access config is refused even with a valid token', () => {
    test('without an audience', async () => {
      const jwt = await token();
      assert.equal(await identify(request(jwt), { ...options, audience: '' }), null);
    });

    test('without a team domain', async () => {
      const jwt = await token();
      assert.equal(await identify(request(jwt), { ...options, teamDomain: '' }), null);
    });
  });

  describe('stand-in email', () => {
    test('is honored when passed in', async () => {
      assert.equal(await identify(request(), { ...options, devEmail: 'dev@example.com' }), 'dev@example.com');
    });

    test('is not honored when not passed in', async () => {
      assert.equal(await identify(request(), { ...options, devEmail: undefined }), null);
    });
  });
});
