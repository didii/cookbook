import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import type { ManagedTag } from '~app/shared/tags';
import { cssFor } from '~testing/css';
import { fireEvent, render, screen } from '~testing/dom';
import { TagRow } from './TagRow';

const soep: ManagedTag = { name: 'Soep', category: 'Gerecht', uses: 7 };
const show = (props: Partial<Parameters<typeof TagRow>[0]> = {}) => {
  const calls = { activate: 0, close: 0 };
  render(
    <ul>
      <TagRow
        tag={soep}
        showCategory
        open={false}
        selecting={false}
        selected={false}
        onActivate={() => calls.activate++}
        onClose={() => calls.close++}
        {...props}
      >
        <input data-testid="Form-field" />
      </TagRow>
    </ul>,
  );
  return calls;
};
const row = () => screen.getByTestId('TagRow-row');

describe('tag-management › Row shows tag, category and count', () => {
  test('the tag is a pill', () => {
    show();
    assert.equal(screen.getByTestId('TagRow-tag').textContent, 'Soep');
  });

  test('the category is a pill', () => {
    show();
    assert.equal(screen.getByTestId('TagRow-category').textContent, 'Gerecht');
  });

  test('the count is shown', () => {
    show();
    assert.match(screen.getByTestId('TagRow-uses').textContent ?? '', /^7/);
  });
});

describe('tag-management › Tag without a category', () => {
  test('its row shows no category pill', () => {
    show({ tag: { ...soep, category: null } });
    assert.equal(screen.queryByTestId('TagRow-category'), null);
  });
});

describe('tag-management › Unused tag', () => {
  test('the count is 0 in the warning colour', async () => {
    show({ tag: { ...soep, uses: 0 } });
    const uses = screen.getByTestId('TagRow-uses');
    assert.match(uses.textContent ?? '', /^0/);
    assert.match(await cssFor(uses.className), /color: var\(--color-red\)/);
  });

  test('a used tag is not in the warning colour', async () => {
    show();
    assert.doesNotMatch(await cssFor(screen.getByTestId('TagRow-uses').className), /color: var\(--color-red\)/);
  });
});

describe('tag-management › Category order has no category pill on rows', () => {
  test('a row without showCategory has no category pill', () => {
    show({ showCategory: false });
    assert.equal(screen.queryByTestId('TagRow-category'), null);
  });
});

describe('TagRow', () => {
  test('activating the row reports it', () => {
    const calls = show();
    fireEvent.click(row());
    assert.equal(calls.activate, 1);
  });

  test('the form is shown only while open', () => {
    show();
    assert.equal(screen.queryByTestId('Form-field'), null);
  });

  test('an open row shows its form and says it is expanded', () => {
    show({ open: true });
    assert.ok(screen.getByTestId('Form-field'));
    assert.equal(row().getAttribute('aria-expanded'), 'true');
  });

  test('Escape in the form closes it and focuses the row', () => {
    const calls = show({ open: true });
    fireEvent.keyDown(screen.getByTestId('Form-field'), { key: 'Escape' });
    assert.equal(calls.close, 1);
    assert.equal(document.activeElement, row());
  });

  test('Escape on a closed row does nothing', () => {
    const calls = show();
    fireEvent.keyDown(row(), { key: 'Escape' });
    assert.equal(calls.close, 0);
  });

  test('Escape in an open suggestion list leaves the form open', () => {
    const calls = show({ open: true });
    const field = screen.getByTestId('Form-field');
    field.setAttribute('aria-expanded', 'true');
    fireEvent.keyDown(field, { key: 'Escape' });
    assert.equal(calls.close, 0);
  });

  test('in select mode the row is a checkbox that says whether it is selected', () => {
    show({ selecting: true, selected: true });
    assert.equal(row().getAttribute('role'), 'checkbox');
    assert.equal(row().getAttribute('aria-checked'), 'true');
    assert.ok(screen.getByTestId('TagRow-check'));
  });

  test('outside select mode there is no checkbox', () => {
    show();
    assert.equal(screen.queryByTestId('TagRow-check'), null);
    assert.equal(row().getAttribute('role'), null);
  });
});
