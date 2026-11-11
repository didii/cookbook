import assert from 'node:assert/strict';
import { describe, test, vi } from 'vitest';
import { expiryChoices } from '~app/shared/shareExpiry';
import { fireEvent, render, screen } from '~testing/dom';
import { ExpiryPicker } from './ExpiryPicker';

const select = () => screen.getByTestId('ExpiryPicker-select') as unknown as HTMLSelectElement;

describe('recipe-sharing › The choices', () => {
  test('the six choices are offered in order', () => {
    render(<ExpiryPicker value="never" onChoose={() => {}} />);
    const labels = screen.getAllByTestId('ExpiryPicker-option').map((o) => o.textContent);
    assert.deepEqual(labels, ['24 uur', '7 dagen', '1 maand', '6 maanden', '1 jaar', 'Nooit']);
    assert.deepEqual(
      screen.getAllByTestId<HTMLOptionElement>('ExpiryPicker-option').map((o) => o.value),
      expiryChoices.map((c) => c.value),
    );
  });

  test('the given choice is selected', () => {
    render(<ExpiryPicker value="never" onChoose={() => {}} />);
    assert.equal(select().value, 'never');
  });
});

describe('recipe-sharing › Any choice is stored', () => {
  test('without a value the placeholder is shown, disabled, and no option is selected', () => {
    render(<ExpiryPicker value="" onChoose={() => {}} />);
    assert.equal(select().value, '');
    assert.equal(screen.getByTestId<HTMLOptionElement>('ExpiryPicker-placeholder').disabled, true);
    assert.ok(screen.getAllByTestId<HTMLOptionElement>('ExpiryPicker-option').every((o) => !o.selected));
  });

  test('choosing an option reports it', () => {
    const onChoose = vi.fn();
    render(<ExpiryPicker value="" onChoose={onChoose} />);
    fireEvent.change(select(), { target: { value: '7d' } });
    assert.deepEqual(onChoose.mock.calls, [['7d']]);
  });
});

describe('ExpiryPicker', () => {
  test('it can be disabled', () => {
    render(<ExpiryPicker value="" onChoose={() => {}} disabled />);
    assert.equal(select().disabled, true);
  });
});
