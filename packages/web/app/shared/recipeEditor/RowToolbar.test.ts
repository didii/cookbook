import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { RowToolbar } from './RowToolbar';

const props = { label: 'Acties', deleteLabel: 'Verwijder', canUp: true, canDown: true, onMove: () => {}, onDelete: () => {} };
const html = (extra: object) => renderToStaticMarkup(createElement(RowToolbar, { ...props, ...extra }));
const count = (s: string, re: RegExp) => s.match(re)?.length ?? 0;

test('a toolbar without insert has three buttons, one in the tab order', () => {
  const out = html({});
  assert.equal(count(out, /<button/g), 3);
  assert.equal(count(out, /tabindex="0"/g), 1);
  assert.ok(!out.includes('Voeg'));
});

test('a toolbar with insert has four buttons, one in the tab order, inert when disabled', () => {
  const out = html({ onInsert: () => {}, insertLabel: 'Voeg toe' });
  assert.equal(count(out, /<button/g), 4);
  assert.equal(count(out, /tabindex="0"/g), 1);
  assert.ok(out.indexOf('Voeg toe') < out.indexOf('Omhoog'));
  assert.equal(count(html({ onInsert: () => {}, insertLabel: 'Voeg toe', disabled: true }), /disabled=""/g), 4);
});
