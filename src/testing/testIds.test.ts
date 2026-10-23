import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { describe, test } from 'node:test';

const app = new URL('../app/', import.meta.url);
const files = (readdirSync(app, { recursive: true, encoding: 'utf8' }) as string[]).filter((f) => f.endsWith('.tsx') && !f.endsWith('.test.tsx'));

describe('test ids', () => {
  test('are named ComponentName-role after a component of their file, and no two files share one', () => {
    const owner = new Map<string, string>();
    for (const file of files) {
      const src = readFileSync(new URL(file, app), 'utf8');
      const components = new Set([...src.matchAll(/(?:function|const) ([A-Z]\w*)/g)].map((m) => m[1]));
      for (const [, id] of src.matchAll(/data-testid="([^"]*)"/g)) {
        const [name, role, ...rest] = id!.split('-');
        assert.ok(components.has(name!) && role && rest.length === 0, `${file}: "${id}" is not ComponentName-role of a component in the file`);
        assert.ok((owner.get(id!) ?? file) === file, `"${id}" is used in ${owner.get(id!)} and ${file}`);
        owner.set(id!, file);
      }
    }
  });

  test('are string literals', () => {
    for (const file of files)
      assert.doesNotMatch(readFileSync(new URL(file, app), 'utf8'), /data-testid=\{/, `${file}: test ids are string literals`);
  });
});
