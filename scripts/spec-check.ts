// Checks that every spec scenario has a test named `<capability> › <Scenario title>`.
// Usage: node scripts/spec-check.ts [--report]   (--report prints the gaps but always exits 0)
import { globSync, readFileSync } from 'node:fs';
import { basename, dirname } from 'node:path';

export type Spec = { capability: string; markdown: string; delta: boolean };
export type TestRef = { name: string; file: string; line: number; todo: boolean };

type Entry = { requirement: string; title: string };

const key = (capability: string, title: string) => `${capability} › ${title}`;

function parseSpec(markdown: string) {
  const scenarios: Entry[] = [];
  const removed: string[] = [];
  let section = '';
  let requirement = '';
  for (const line of markdown.split(/\r?\n/)) {
    const heading = line.match(/^## (?:(ADDED|MODIFIED|REMOVED|RENAMED) )?Requirements\b/);
    if (heading) section = heading[1] ?? '';
    const req = line.match(/^### Requirement:\s*(.+?)\s*$/);
    if (req) {
      requirement = req[1];
      if (section === 'REMOVED') removed.push(requirement);
    }
    const scenario = line.match(/^#### Scenario:\s*(.+?)\s*$/);
    if (scenario && section !== 'REMOVED' && section !== 'RENAMED') scenarios.push({ requirement, title: scenario[1] });
  }
  return { scenarios, removed };
}

/** Scenario keys of the main specs and delta specs. A removed requirement drops its main scenarios; a title repeated within one spec file is reported. */
export function parseScenarios(specs: Spec[]) {
  const parsed = specs.map((spec) => ({ ...spec, ...parseSpec(spec.markdown) }));
  const removed = new Set(parsed.flatMap((p) => p.removed.map((r) => key(p.capability, r))));
  const keys = new Set<string>();
  const duplicates = new Set<string>();
  for (const p of parsed) {
    const seen = new Set<string>();
    for (const { requirement, title } of p.scenarios) {
      const k = key(p.capability, title);
      if (seen.has(k)) duplicates.add(k);
      seen.add(k);
      if (p.delta || !removed.has(key(p.capability, requirement))) keys.add(k);
    }
  }
  return { keys, duplicates };
}

/** Tests whose name starts with `<kebab-case> › `, including `test.todo`. */
export function findTests(files: { path: string; text: string }[]): TestRef[] {
  const re = /\b(?:test|it)(\.todo)?\(\s*(['"`])((?:(?!\2).)*)\2/;
  return files.flatMap(({ path, text }) =>
    text.split(/\r?\n/).flatMap((line, i) => {
      const m = line.match(re);
      return m && /^[a-z0-9]+(?:-[a-z0-9]+)* › /.test(m[3]) ? [{ name: m[3], file: path, line: i + 1, todo: !!m[1] }] : [];
    }),
  );
}

export function check(scenarios: { keys: Set<string>; duplicates: Set<string> }, tests: TestRef[]) {
  const named = new Set(tests.map((t) => t.name));
  return {
    missing: [...scenarios.keys].filter((k) => !named.has(k)),
    unknown: tests.filter((t) => !scenarios.keys.has(t.name)),
    duplicates: [...scenarios.duplicates],
  };
}

function main() {
  const report = process.argv.includes('--report');
  const specFiles = [...globSync('openspec/specs/*/spec.md'), ...globSync('openspec/changes/*/specs/*/spec.md')];
  const specs = specFiles.map((f) => ({
    capability: basename(dirname(f)),
    markdown: readFileSync(f, 'utf8'),
    delta: f.replaceAll('\\', '/').startsWith('openspec/changes/'),
  }));
  const testFiles = globSync('packages/**/*.test.ts', { exclude: (p) => basename(String(p)) === 'node_modules' });
  const tests = findTests(testFiles.map((path) => ({ path: path.replaceAll('\\', '/'), text: readFileSync(path, 'utf8') })));
  const scenarios = parseScenarios(specs);
  const { missing, unknown, duplicates } = check(scenarios, tests);

  console.log('Scenarios:');
  for (const k of [...scenarios.keys].sort()) {
    const refs = tests.filter((t) => t.name === k && !t.todo).map((t) => `${t.file}:${t.line}`);
    console.log(`  ${k} -> ${refs.length ? refs.join(', ') : '(none)'}`);
  }
  const todos = tests.filter((t) => t.todo);
  if (todos.length) {
    console.log('\nTodo (not automated):');
    for (const t of todos) console.log(`  ${t.name} -> ${t.file}:${t.line}`);
  }
  const problems = [
    ...missing.map((k) => `no test: ${k}`),
    ...unknown.map((t) => `unknown scenario: ${t.name} (${t.file}:${t.line})`),
    ...duplicates.map((k) => `duplicate scenario title: ${k}`),
  ];
  if (problems.length) console.log(`\nProblems:\n${problems.map((p) => `  ${p}`).join('\n')}`);
  process.exitCode = problems.length && !report ? 1 : 0;
}

if (import.meta.main) main();
