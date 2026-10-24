import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { render } from '~testing/dom';
import { ClockSetting } from './ClockSetting';

describe('ClockSetting', () => {
  test('renders nothing where the clock app is not available', () => {
    assert.equal(render(<ClockSetting />).container.firstChild, null);
  });
});
