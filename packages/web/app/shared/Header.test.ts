import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

// Rendering the header needs the JSX settings that tsx doesn't read from this project's tsconfig, so this checks the source:
// the header links to the new recipe address and the route table serves it.
test('recipe-creation › Link to the form', () => {
  assert.match(readFileSync(new URL('./Header.tsx', import.meta.url), 'utf8'), /to="\/recepten\/nieuw"/);
  assert.match(readFileSync(new URL('../routes.ts', import.meta.url), 'utf8'), /route\('recepten\/nieuw'/);
});

// Which text shows depends on CSS breakpoints, so it needs a real browser; checked by hand at 360px and desktop width.
test.todo('recipe-creation › Link on a narrow screen');
