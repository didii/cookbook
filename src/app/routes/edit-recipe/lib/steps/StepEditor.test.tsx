import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { render, screen } from '~testing/dom';
import { noRows, stepOf } from './chipsHarness';
import { StepEditor } from './StepEditor';

const noop = () => {};
const show = (props: Partial<Parameters<typeof StepEditor>[0]> = {}) =>
  render(
    <ol>
      <StepEditor
        number={1}
        step={stepOf({ body: 'een', ingredients: [] })}
        context={noRows}
        canUp={false}
        canDown={false}
        onType={noop}
        onChips={noop}
        onEdit={noop}
        onEnter={noop}
        free={false}
        onBackspaceEmpty={noop}
        onRemove={noop}
        onInsert={noop}
        onMove={noop}
        gripProps={{}}
        {...props}
      />
    </ol>,
  );

describe('StepEditor error and limit', () => {
  test('the error is shown and the field is described by it', () => {
    show({ error: 'Fout' });
    const message = screen.getByTestId('StepEditor-error');
    assert.equal(message.textContent, 'Fout');
    assert.equal(screen.getByTestId('StepText-field').getAttribute('aria-describedby'), message.id);
  });

  test('without an error no message is shown', () => {
    show();
    assert.equal(screen.queryByTestId('StepEditor-error'), null);
  });

  test('the field takes at most maxLength characters', () => {
    show({ maxLength: 42 });
    assert.equal(screen.getByTestId<HTMLTextAreaElement>('StepText-field').maxLength, 42);
  });
});
