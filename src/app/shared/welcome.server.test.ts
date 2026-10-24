import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import type { User } from './users.server';
import { redirectToWelcome } from './welcome.server';

const member = {} as User;

// The root loader throws what redirectToWelcome returns, for every page document.
const welcome = (user: User | undefined, path: string) => redirectToWelcome(user, new URL(`http://localhost${path}`))?.headers.get('Location');
const newcomer = (path: string) => welcome(undefined, path);

describe('users › First visit', () => {
  test('redirects to the welcome screen, returning to the home page', () => {
    assert.equal(newcomer('/'), '/welkom?returnUrl=%2F');
  });
});

describe('users › Any other page on a first visit', () => {
  test('redirects to the welcome screen, returning to that page', () => {
    assert.equal(newcomer('/recepten/soep?stap=2'), '/welkom?returnUrl=%2Frecepten%2Fsoep%3Fstap%3D2');
  });
});

describe('redirectToWelcome', () => {
  describe('the welcome screen itself', () => {
    for (const path of ['/welkom?returnUrl=%2F', '/Welkom'])
      test(`${path} is not redirected, so a new member can reach it`, () => {
        assert.equal(newcomer(path), undefined);
      });
  });

  describe('data requests', () => {
    test('a data request of the welcome screen is not redirected', () => {
      assert.equal(newcomer('/welkom.data?returnUrl=%2F'), undefined);
    });

    test('a data request of a page returns to that page', () => {
      assert.equal(newcomer('/recepten/soep.data?stap=2&_routes=root'), '/welkom?returnUrl=%2Frecepten%2Fsoep%3Fstap%3D2');
    });

    test('a data request of the root returns to the home page', () => {
      assert.equal(newcomer('/_root.data'), '/welkom?returnUrl=%2F');
    });
  });
});

describe('users › Returning member', () => {
  test('is not redirected from the home page', () => {
    assert.equal(welcome(member, '/'), undefined);
  });

  test('is not redirected from another page', () => {
    assert.equal(welcome(member, '/recepten/soep'), undefined);
  });
});
