import { after, afterEach } from 'node:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';

// Keep Node's own networking, stream and abort classes: the test database (Miniflare) and the loader and action tests in the same file use the real ones, and they refuse happy-dom's lookalikes.
const keep = [
  'fetch',
  'Request',
  'Response',
  'Headers',
  'FormData',
  'ReadableStream',
  'WritableStream',
  'TransformStream',
  'Blob',
  'File',
  'AbortController',
  'AbortSignal',
  'URL',
  'URLSearchParams',
] as const;
const node = Object.fromEntries(keep.map((name) => [name, globalThis[name]]));
GlobalRegistrator.register({ url: 'http://localhost/' });
Object.assign(globalThis, node);

// Loaded after the registration, because Testing Library binds `screen` to `document.body` when it loads. Tests import these from here, so the order of their imports does not matter.
// Annotated: inferred, the types name a path inside node_modules/.pnpm, which declaration output cannot refer to.
const testing: typeof import('@testing-library/react') = await import('@testing-library/react');
export const render: typeof testing.render = testing.render;
export const screen: typeof testing.screen = testing.screen;
export const fireEvent: typeof testing.fireEvent = testing.fireEvent;
export const within: typeof testing.within = testing.within;
export const act: typeof testing.act = testing.act;
/** Removes what was rendered; it also happens after each test, so only a test that renders twice needs it. */
export const cleanup: typeof testing.cleanup = testing.cleanup;
afterEach(() => cleanup());
// Happy-dom keeps timers alive that stop `node --test` from exiting.
after(() => GlobalRegistrator.unregister());

/** Whether `a` comes before `b` in the document. */
export const precedes = (a: Node, b: Node) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

/** Opens the popup of a Base UI Autocomplete. A change event alone does not: it opens from the pointer or the arrow key. */
export function openAutocomplete(input: HTMLElement) {
  input.focus();
  fireEvent.pointerDown(input);
  fireEvent.mouseDown(input);
  fireEvent.click(input);
  fireEvent.keyDown(input, { key: 'ArrowDown' });
}
