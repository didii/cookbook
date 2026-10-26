import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { describe, test } from 'vitest';

const pub = new URL('../../public/', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('manifest.webmanifest', pub), 'utf8'));
const css = readFileSync(new URL('./app.css', import.meta.url), 'utf8');
const token = (name: string) => css.match(new RegExp(`--color-${name}: (#[0-9a-f]{6})`))?.[1];

describe('installable-app › Manifest names the app', () => {
  test('has the name', () => {
    assert.equal(manifest.name, 'Familiekookboek');
  });
  test('starts at the root', () => {
    assert.equal(manifest.start_url, '/');
  });
  test('shows without browser chrome', () => {
    assert.equal(manifest.display, 'standalone');
  });
  test('is Dutch', () => {
    assert.equal(manifest.lang, 'nl');
  });
});

describe('installable-app › Manifest uses the site colours', () => {
  test('theme colour is the red of the header', () => {
    assert.equal(manifest.theme_color, token('red'));
  });
  test('background colour is the page colour', () => {
    assert.equal(manifest.background_color, token('por'));
  });
});

describe('installable-app › Icons are listed', () => {
  const icon = (sizes: string, purpose?: string) =>
    manifest.icons.find((i: { sizes: string; purpose?: string }) => i.sizes === sizes && i.purpose === purpose);
  test('has a 192 px icon', () => {
    assert.ok(icon('192x192'));
  });
  test('has a 512 px icon', () => {
    assert.ok(icon('512x512'));
  });
  test('has a maskable 512 px icon', () => {
    assert.ok(icon('512x512', 'maskable'));
  });
  test('every listed file exists', () => {
    for (const { src } of manifest.icons) assert.ok(existsSync(new URL(src.slice(1), pub)), src);
  });
});
