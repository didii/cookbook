import assert from 'node:assert/strict';
import { afterEach, describe, test } from 'vitest';
import { render } from '~testing/dom';
import { ServiceWorker } from './ServiceWorker';

const original = Object.getOwnPropertyDescriptor(navigator, 'serviceWorker');
const stub = (value: unknown) => Object.defineProperty(navigator, 'serviceWorker', { value, configurable: true });

afterEach(() => {
  if (original) Object.defineProperty(navigator, 'serviceWorker', original);
  else Reflect.deleteProperty(navigator, 'serviceWorker');
});

describe('installable-app › Service worker is registered', () => {
  test('registers the worker for the whole site', () => {
    const registered: unknown[][] = [];
    stub({ register: (...args: unknown[]) => (registered.push(args), Promise.resolve()) });
    render(<ServiceWorker />);
    assert.deepEqual(registered, [['/sw.js', { scope: '/' }]]);
  });

  test('a failed registration does not break the app', async () => {
    stub({ register: () => Promise.reject(new Error('blocked')) });
    render(<ServiceWorker />);
    await new Promise((resolve) => setTimeout(resolve));
  });
});

describe('installable-app › No service worker support', () => {
  test('renders without a service worker API', () => {
    Reflect.deleteProperty(navigator, 'serviceWorker');
    assert.doesNotThrow(() => render(<ServiceWorker />));
  });
});
