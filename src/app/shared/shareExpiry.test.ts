import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { expiryChoices, expiryFor, isExpiryChoice } from './shareExpiry';

const at = (iso: string) => new Date(iso);

describe('expiryFor', () => {
  test('24 hours are exact', () => {
    assert.equal(expiryFor('24h', at('2026-03-10T08:30:15Z')), '2026-03-11T08:30:15Z');
  });

  test('7 days are exact', () => {
    assert.equal(expiryFor('7d', at('2026-03-10T08:30:15Z')), '2026-03-17T08:30:15Z');
  });

  test('a month keeps the day when it exists', () => {
    assert.equal(expiryFor('1m', at('2026-03-10T08:30:15Z')), '2026-04-10T08:30:15Z');
  });

  test('6 months and a year are calendar months', () => {
    assert.equal(expiryFor('6m', at('2026-03-10T08:30:15Z')), '2026-09-10T08:30:15Z');
    assert.equal(expiryFor('1y', at('2026-03-10T08:30:15Z')), '2027-03-10T08:30:15Z');
  });

  test('never has no end date', () => {
    assert.equal(expiryFor('never', at('2026-03-10T08:30:15Z')), null);
  });

  test('milliseconds are dropped', () => {
    assert.equal(expiryFor('24h', at('2026-03-10T08:30:15.789Z')), '2026-03-11T08:30:15Z');
  });
});

describe('recipe-sharing › A month ends on the last day when needed', () => {
  test('31 January plus a month is the last day of February', () => {
    assert.equal(expiryFor('1m', at('2027-01-31T12:00:00Z')), '2027-02-28T12:00:00Z');
  });

  test('in a leap year that is the 29th', () => {
    assert.equal(expiryFor('1m', at('2028-01-31T12:00:00Z')), '2028-02-29T12:00:00Z');
  });

  test('29 February plus a year is 28 February', () => {
    assert.equal(expiryFor('1y', at('2028-02-29T12:00:00Z')), '2029-02-28T12:00:00Z');
  });

  test('31 August plus 6 months is the last day of February', () => {
    assert.equal(expiryFor('6m', at('2026-08-31T12:00:00Z')), '2027-02-28T12:00:00Z');
  });

  test('a month rolls over the year end', () => {
    assert.equal(expiryFor('1m', at('2026-12-31T12:00:00Z')), '2027-01-31T12:00:00Z');
  });
});

describe('isExpiryChoice', () => {
  test('accepts the six choices', () => {
    assert.ok(expiryChoices.every((c) => isExpiryChoice(c.value)));
  });

  test('refuses anything else', () => {
    assert.equal(isExpiryChoice('2d'), false);
    assert.equal(isExpiryChoice(null), false);
  });
});
