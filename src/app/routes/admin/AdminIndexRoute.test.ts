import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { loader } from './AdminIndexRoute';

describe('admin-nav › Opening the admin area', () => {
  test('/beheer is sent to the rules page', () => {
    const response = loader();
    assert.equal(response.status, 302);
    assert.equal(response.headers.get('Location'), '/beheer/herkenning');
  });
});
