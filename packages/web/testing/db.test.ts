import { test } from 'node:test';
import { createTestDb } from './db';

test('creates a database with the migrations applied', async () => {
  const { dispose } = await createTestDb();
  await dispose();
});
