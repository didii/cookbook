import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'vitest';
import { check, checkRepo, findTests, parseScenarios } from './spec-check.ts';

const main = `## Requirements

### Requirement: Keep
#### Scenario: Stays

### Requirement: Drop
#### Scenario: Goes away

### Requirement: Change
#### Scenario: Old wording
`;

const delta = `## ADDED Requirements

### Requirement: New
#### Scenario: Fresh

## MODIFIED Requirements

### Requirement: Change
#### Scenario: Stays

## REMOVED Requirements

### Requirement: Drop
#### Scenario: Never collected
`;

test('collects main and delta scenarios, honoring REMOVED and de-duplicating', () => {
  const { keys } = parseScenarios([
    { capability: 'cap', markdown: main, delta: false },
    { capability: 'cap', markdown: delta, delta: true },
  ]);
  assert.deepEqual([...keys].sort(), ['cap › Fresh', 'cap › Old wording', 'cap › Stays']);
});

test('reports a title repeated within one capability', () => {
  const { duplicates } = parseScenarios([{ capability: 'cap', markdown: `${main}\n#### Scenario: Stays\n`, delta: false }]);
  assert.deepEqual([...duplicates], ['cap › Stays']);
});

test('findTests reads describe, test, it and todo names with a capability prefix', () => {
  const tests = findTests([
    {
      path: 'a.test.ts',
      text: [
        "test('cap › Stays', () => {});",
        'it("cap › Fresh", () => {});',
        "test.todo('cap › Old wording');",
        "describe('cap › Grouped', () => {});",
        "test('free-form edge case', () => {});",
      ].join('\n'),
    },
  ]);
  assert.deepEqual(
    tests.map((t) => [t.name, t.line, t.todo]),
    [
      ['cap › Stays', 1, false],
      ['cap › Fresh', 2, false],
      ['cap › Old wording', 3, true],
      ['cap › Grouped', 4, false],
    ],
  );
});

test('check lists missing scenarios, unknown test names and duplicates; a todo satisfies a scenario', () => {
  const scenarios = { keys: new Set(['cap › A', 'cap › B', 'cap › C']), duplicates: new Set(['cap › A']) };
  const tests = [
    { name: 'cap › A', file: 'a.test.ts', line: 1, todo: false },
    { name: 'cap › B', file: 'a.test.ts', line: 2, todo: true },
    { name: 'cap › Gone', file: 'a.test.ts', line: 3, todo: false },
  ];
  const result = check(scenarios, tests);
  assert.deepEqual(result.missing, ['cap › C']);
  assert.deepEqual(
    result.unknown.map((t) => t.name),
    ['cap › Gone'],
  );
  assert.deepEqual(result.duplicates, ['cap › A']);
});

test('parseScenarios can ignore REMOVED, so a pending removal keeps the main scenario', () => {
  const { keys } = parseScenarios(
    [
      { capability: 'cap', markdown: main, delta: false },
      { capability: 'cap', markdown: delta, delta: true },
    ],
    false,
  );
  assert.deepEqual([...keys].sort(), ['cap › Fresh', 'cap › Goes away', 'cap › Old wording', 'cap › Stays']);
});

/** Builds a throwaway repo layout (main specs, changes, test files) and runs `checkRepo` on it. */
function checkFixture(files: Record<string, string>, change?: string) {
  const root = mkdtempSync(join(tmpdir(), 'spec-check-'));
  try {
    for (const [path, text] of Object.entries(files)) {
      mkdirSync(join(root, dirname(path)), { recursive: true });
      writeFileSync(join(root, path), text);
    }
    return checkRepo(root, change);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const mainFile = 'openspec/specs/cap/spec.md';
const changeFile = 'openspec/changes/later/specs/cap/spec.md';
const testsFile = (...names: string[]) => names.map((n) => `test.todo('${n}');`).join('\n');

test('a pending change that removes a requirement does not make the tests of its scenarios unknown', () => {
  const problems = checkFixture({
    [mainFile]: main,
    [changeFile]: delta,
    'a.test.ts': testsFile('cap › Stays', 'cap › Goes away', 'cap › Old wording'),
  });
  assert.deepEqual(problems, []);
});

test('a pending change that adds or modifies scenarios never fails the check, with or without tests for them', () => {
  const base = { [mainFile]: main, [changeFile]: delta };
  assert.deepEqual(checkFixture({ ...base, 'a.test.ts': testsFile('cap › Stays', 'cap › Goes away', 'cap › Old wording') }), []);
  assert.deepEqual(checkFixture({ ...base, 'a.test.ts': testsFile('cap › Stays', 'cap › Goes away', 'cap › Old wording', 'cap › Fresh') }), []);
});

test('a test naming a scenario that no spec or change has is still reported', () => {
  const problems = checkFixture({
    [mainFile]: main,
    [changeFile]: delta,
    'a.test.ts': testsFile('cap › Stays', 'cap › Goes away', 'cap › Old wording', 'cap › Nowhere'),
  });
  assert.deepEqual(problems, ['unknown scenario: cap › Nowhere (a.test.ts:4)']);
});

test('a main scenario without a test is still reported when a change is pending', () => {
  const problems = checkFixture({ [mainFile]: main, [changeFile]: delta, 'a.test.ts': testsFile('cap › Stays', 'cap › Goes away') });
  assert.deepEqual(problems, ['no test: cap › Old wording']);
});

test('with a change given, its removed requirement needs no test but its added scenarios do', () => {
  const files = { [mainFile]: main, [changeFile]: delta };
  assert.deepEqual(checkFixture({ ...files, 'a.test.ts': testsFile('cap › Stays', 'cap › Old wording') }, 'later'), ['no test: cap › Fresh']);
  assert.deepEqual(checkFixture({ ...files, 'a.test.ts': testsFile('cap › Stays', 'cap › Old wording', 'cap › Fresh') }, 'later'), []);
});

test('every spec scenario has a test and every scenario-named test has a spec', () => {
  assert.deepEqual(checkRepo(), []);
});
