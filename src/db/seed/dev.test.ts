import { join } from 'node:path';
import { describe, test } from 'node:test';
import { applySql, createTestDb } from '~testing/db';

describe('dev seed', () => {
  test('runs against the migrated schema', async () => {
    const { db, dispose } = await createTestDb();
    try {
      await applySql(db, join(import.meta.dirname, 'dev.sql'));
    } finally {
      await dispose();
    }
  });
});
