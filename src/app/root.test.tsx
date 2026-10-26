import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import type { HtmlLinkDescriptor } from 'react-router';
import { describe, test } from 'vitest';
import { render, within } from '~testing/dom';
import { links } from './root';
import { ThemeColor } from './shared/components';

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
