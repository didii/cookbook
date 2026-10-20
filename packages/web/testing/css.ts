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
