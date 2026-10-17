import assert from 'node:assert/strict';
import { test } from 'node:test';
import { check, findTests, parseScenarios } from './spec-check.ts';

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

test('findTests reads test, it and todo names with a capability prefix', () => {
  const tests = findTests([
    {
      path: 'a.test.ts',
      text: [
        "test('cap › Stays', () => {});",
        'it("cap › Fresh", () => {});',
        "test.todo('cap › Old wording');",
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
