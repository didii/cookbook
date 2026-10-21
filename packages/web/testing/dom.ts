import { afterEach } from 'node:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';

// Keep Node's own networking classes: loader and action tests in the same file use the real ones.
const node = { fetch, Request, Response, Headers, FormData };
GlobalRegistrator.register({ url: 'http://localhost/' });
Object.assign(globalThis, node);

// Loaded after the registration, because Testing Library binds `screen` to `document.body` when it loads. Tests import these from here, so the order of their imports does not matter.
// Annotated: inferred, the types name a path inside node_modules/.pnpm, which declaration output cannot refer to.
const testing: typeof import('@testing-library/react') = await import('@testing-library/react');
export const render: typeof testing.render = testing.render;
export const screen: typeof testing.screen = testing.screen;
export const fireEvent: typeof testing.fireEvent = testing.fireEvent;
export const within: typeof testing.within = testing.within;
afterEach(() => testing.cleanup());

/** Opens the popup of a Base UI Autocomplete. A change event alone does not: it opens from the pointer or the arrow key. */
export function openAutocomplete(input: HTMLElement) {
  input.focus();
  fireEvent.pointerDown(input);
  fireEvent.mouseDown(input);
  fireEvent.click(input);
  fireEvent.keyDown(input, { key: 'ArrowDown' });
}
