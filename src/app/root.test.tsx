import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { RouterContextProvider, type HtmlLinkDescriptor } from 'react-router';
import { afterEach, beforeEach, describe, test, vi } from 'vitest';
import { render, waitFor, within } from '~testing/dom';
import { fake } from '~testing/fake';
import type { Route } from './+types/root';
import { ErrorBoundary, links, loader as rootLoader } from './root';
import { ThemeColor } from './shared/components';
import { envContext, publicRequestContext } from './shared/context.server';
import { isSessionExpired } from './shared/isSessionExpired';

vi.mock('./shared/isSessionExpired', () => ({ isSessionExpired: vi.fn() }));

const pub = new URL('../../public/', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('manifest.webmanifest', pub), 'utf8'));
const linkOf = (rel: string) => links().find((l): l is HtmlLinkDescriptor => 'rel' in l && l.rel === rel);

describe('installable-app › Pages link the manifest', () => {
  test('links the manifest with credentials', () => {
    const link = linkOf('manifest');
    assert.equal(link?.href, '/manifest.webmanifest');
    assert.equal(link?.crossOrigin, 'use-credentials');
  });

  test('links an apple-touch-icon that exists', () => {
    const href = linkOf('apple-touch-icon')?.href;
    assert.ok(href && existsSync(new URL(href.slice(1), pub)));
  });

  test('sets the theme colour of the manifest', () => {
    render(<ThemeColor />);
    // React hoists the meta tag into the head.
    assert.equal(within(document.head).getByTestId('ThemeColor-meta').getAttribute('content'), manifest.theme_color);
  });
});

describe('ErrorBoundary', () => {
  const originalLocation = window.location;
  let reload: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    reload = vi.fn();
    Object.defineProperty(window, 'location', { configurable: true, value: { href: 'http://localhost/', reload } });
  });
  afterEach(() => {
    vi.mocked(isSessionExpired).mockReset();
    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
  });

  const props = (error: unknown) => ({ error }) as Route.ErrorBoundaryProps;

  describe('session-expiry › Expired session while saving', () => {
    test('reloads the page', async () => {
      vi.mocked(isSessionExpired).mockResolvedValue(true);
      render(<ErrorBoundary {...props(new TypeError('Failed to fetch'))} />);
      await waitFor(() => assert.equal(reload.mock.calls.length, 1));
    });

    test('shows the sign-in line, not the error', async () => {
      vi.mocked(isSessionExpired).mockResolvedValue(true);
      const { findByTestId, queryByTestId } = render(<ErrorBoundary {...props(new TypeError('Failed to fetch'))} />);
      await findByTestId('ErrorBoundary-signin');
      assert.equal(queryByTestId('ErrorBoundary-error'), null);
    });
  });

  describe('session-expiry › Expired session while opening a page', () => {
    test('reloads the page', async () => {
      vi.mocked(isSessionExpired).mockResolvedValue(true);
      render(<ErrorBoundary {...props(new TypeError('Failed to fetch'))} />);
      await waitFor(() => assert.equal(reload.mock.calls.length, 1));
    });
  });

  describe('session-expiry › No connection is not an expired session', () => {
    test('shows the error page and does not reload', async () => {
      vi.mocked(isSessionExpired).mockResolvedValue(false);
      const { findByTestId } = render(<ErrorBoundary {...props(new TypeError('Failed to fetch'))} />);
      await findByTestId('ErrorBoundary-error');
      assert.equal(reload.mock.calls.length, 0);
    });
  });

  describe('session-expiry › Other failures are not an expired session', () => {
    test('shows the error page and does not reload', async () => {
      vi.mocked(isSessionExpired).mockResolvedValue(false);
      const { findByTestId } = render(<ErrorBoundary {...props(new TypeError('Failed to fetch'))} />);
      await findByTestId('ErrorBoundary-error');
      assert.equal(reload.mock.calls.length, 0);
    });

    test('does not probe for an error that is not a TypeError', async () => {
      const { getByTestId } = render(<ErrorBoundary {...props(new Error('boom'))} />);
      getByTestId('ErrorBoundary-error');
      assert.equal(vi.mocked(isSessionExpired).mock.calls.length, 0);
    });
  });
});

describe('loader', () => {
  const load = (context: RouterContextProvider) =>
    rootLoader(fake<Route.LoaderArgs>({ request: new Request('http://localhost/share/appeltaart'), context }));

  // The environment has no database: a lookup of the member would throw.
  test('for a public request returns an empty member without looking anyone up', async () => {
    const context = new RouterContextProvider();
    context.set(publicRequestContext, true);
    context.set(envContext, fake<Env>({}));
    assert.deepEqual(await load(context), { email: '', role: 'user' });
  });

  test('for any other request needs the member', async () => {
    const context = new RouterContextProvider();
    context.set(envContext, fake<Env>({}));
    await assert.rejects(load(context));
  });
});

// Covered by recipe-draft › A reload restores the draft (draftStore.test.ts) and endDraftAfterSave.test.ts › "a failure that is not a redirect does not end it": a failed save keeps the draft, a reload restores it.
test.todo('session-expiry › Edits come back after signing in');
