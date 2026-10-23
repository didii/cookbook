import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { openAutocomplete, render, screen } from './dom';

describe('render', () => {
  test('renders into a DOM that is queried by test id', () => {
    render(<button data-testid="ja">Ja</button>);
    assert.equal(screen.getByTestId('ja').tagName, 'BUTTON');
  });

  test('the previous render is cleaned up', () => assert.equal(document.body.innerHTML, ''));
});

describe('Node networking classes', () => {
  test('Response keeps status and headers', () => {
    const res = new Response(null, { status: 303, headers: { Location: '/x' } });
    assert.equal(res.status, 303);
    assert.equal(res.headers.get('Location'), '/x');
  });

  test('Request keeps its method', () => {
    assert.equal(new Request('http://localhost/a', { method: 'POST', body: new FormData() }).method, 'POST');
  });
});

describe('openAutocomplete', () => {
  test('opens a popup from the pointer and the arrow key', () => {
    const opened: string[] = [];
    render(<input data-testid="field" aria-label="x" onPointerDown={() => opened.push('pointer')} onKeyDown={(e) => opened.push(e.key)} />);
    openAutocomplete(screen.getByTestId('field'));
    assert.deepEqual(opened, ['pointer', 'ArrowDown']);
  });
});
