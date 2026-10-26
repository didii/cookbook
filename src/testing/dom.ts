import { GlobalRegistrator } from '@happy-dom/global-registrator';
import { afterAll, afterEach } from 'vitest';

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
  'setTimeout',
  'clearTimeout',
] as const;
const node = Object.fromEntries(keep.map((name) => [name, globalThis[name]]));
GlobalRegistrator.register({ url: 'http://localhost/' });
const domFormData = globalThis.FormData;
Object.assign(globalThis, node);
// React reads a submitted form with `new FormData(form)`, which Node's class refuses for a happy-dom form: that one case goes to happy-dom's class, everything else stays Node's.
globalThis.FormData = new Proxy(node.FormData as typeof FormData, {
  construct: (target, args, newTarget) =>
    args[0] instanceof HTMLFormElement ? Reflect.construct(domFormData, args) : Reflect.construct(target, args, newTarget),
});

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
// Storage lives as long as the DOM, so it is emptied after every test: no test sees what an earlier one stored.
afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});
// Happy-dom keeps timers alive that stop the test run from exiting.
afterAll(() => GlobalRegistrator.unregister());

/** Sets the size of the window, which media queries (`matchMedia`) answer for. A new DOM is 1024 wide. */
export const setViewport = (width: number, height = 768) =>
  (window as unknown as { happyDOM: { setViewport(size: { width: number; height: number }): void } }).happyDOM.setViewport({ width, height });

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
