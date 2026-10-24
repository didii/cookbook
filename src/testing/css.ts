import { readFileSync } from 'node:fs';
import { compile } from 'tailwindcss';

/** The CSS Tailwind generates for the given classes, compiled with the app's own theme. */
export async function cssFor(classes: string) {
  const read = (path: string | URL) => readFileSync(path, 'utf8');
  const { build } = await compile(read(new URL('../app/app.css', import.meta.url)), {
    base: process.cwd(),
    loadStylesheet: async (id, base) => ({
      path: id,
      base,
      content: id === 'tailwindcss' ? read(new URL(import.meta.resolve('tailwindcss/index.css'))) : '',
    }),
  });
  const css = build(classes.split(/\s+/));
  return css.slice(css.indexOf('@layer utilities'), css.indexOf('@property'));
}

/** The rules the classes apply inside the media query, e.g. `(width >= 52rem)`; empty when there are none. */
export async function mediaFor(classes: string, query: string) {
  return (await cssFor(classes)).replace(/\s+/g, ' ').split(`@media ${query} {`)[1]?.split('} }')[0] ?? '';
}

/** Whether the classes hide the element (`display: none`) inside the media query. */
export async function hidesAt(classes: string, query: string) {
  return (await mediaFor(classes, query)).includes('display: none');
}
