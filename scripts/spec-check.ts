// Checks that every spec scenario has a test named `<capability> › <Scenario title>`.
// Run by spec-check.test.ts, so `pnpm test` fails on a gap; `pnpm test:spec <change>` checks a change not yet in the main specs.
import { globSync, readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

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

/**
 * Scenario keys of the main specs and delta specs. A title repeated within one spec file is reported.
 * A requirement removed by a delta drops its main scenarios, unless `honorRemoved` is false.
 */
export function parseScenarios(specs: Spec[], honorRemoved = true) {
  const parsed = specs.map((spec) => ({ ...spec, ...parseSpec(spec.markdown) }));
  const removed = new Set(honorRemoved ? parsed.flatMap((p) => p.removed.map((r) => key(p.capability, r))) : []);
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

/** Tests and `describe` blocks whose name starts with `<kebab-case> › `, including `test.todo`. */
export function findTests(files: { path: string; text: string }[]): TestRef[] {
  const re = /\b(?:describe|test|it)(\.todo)?\(\s*(['"`])((?:(?!\2).)*)\2/;
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

/**
 * Checks the repo's specs against its tests and returns one line per violation (empty when clean).
 * Every scenario of `openspec/specs` needs a test; with `change`, the scenarios of that change's delta specs do too.
 * A test may name a scenario of any change, so a change can be built before it is merged into the main specs.
 * Pending changes never take names away: a scenario that a change removes or renames keeps its test valid until the change is merged.
 */
export function checkRepo(root = join(import.meta.dirname, '..'), change?: string) {
  const read = (f: string) => readFileSync(join(root, f), 'utf8');
  const norm = (f: string) => f.replaceAll('\\', '/');
  const load = (pattern: string, delta: boolean) =>
    globSync(pattern, { cwd: root }).map((f) => ({ capability: basename(dirname(f)), markdown: read(f), delta }));
  const main = load('openspec/specs/*/spec.md', false);
  const required = [...main, ...(change ? load(`openspec/changes/${change}/specs/*/spec.md`, true) : [])];
  if (change && required.length === main.length) return [`no delta specs found for change: ${change}`];
  const all = [...main, ...load('openspec/changes/*/specs/*/spec.md', true)];
  // `**` skips dot directories, so `.server/` is listed explicitly
  const testFiles = globSync(['**/*.test.{ts,tsx}', 'src/app/.server/*.test.ts'], {
    cwd: root,
    exclude: (p) => ['node_modules', 'scripts'].includes(basename(String(p))), // scripts/ holds the fixtures of spec-check.test.ts
  });
  const tests = findTests(testFiles.map((f) => ({ path: norm(f), text: read(f) })));
  const { missing, duplicates } = check(parseScenarios(required), tests);
  // A change only adds names a test may use: its removals must not make the tests of the main specs unknown before it is merged.
  const { unknown } = check(parseScenarios(all, false), tests);
  return [
    ...missing.map((k) => `no test: ${k}`),
    ...unknown.map((t) => `unknown scenario: ${t.name} (${t.file}:${t.line})`),
    ...duplicates.map((k) => `duplicate scenario title: ${k}`),
  ];
}

// `pnpm test:spec <change>`: check one change's delta specs on top of the main specs.
if (import.meta.main) {
  const change = process.argv[2];
  if (!change) throw new Error('usage: pnpm test:spec <change>');
  const problems = checkRepo(undefined, change);
  console.log(problems.length ? problems.join('\n') : `${change}: every scenario has a test`);
  process.exitCode = problems.length ? 1 : 0;
}
