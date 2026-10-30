import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { cssFor, mediaFor } from '~testing/css';
import { render, screen } from '~testing/dom';
import { Button } from './components/Button';
import { Segmented } from './components/Segmented';
import { hoverDarken, hoverField, hoverRecolor, hoverTint, hoverUnderline } from './hover';

const hovering = '(hover: hover)';
const tint = /background-color: var\(--color-hover\)/;

describe('hover-feedback › Hovering a button', () => {
  test('an enabled button gets the tint', async () => {
    render(<Button data-testid="Test-button" />);
    assert.match(await mediaFor(screen.getByTestId('Test-button').className, hovering), tint);
  });
});

describe('hover-feedback › Hovering a segment', () => {
  const segments = () => {
    render(
      <Segmented
        legend="Volgorde"
        options={[{ value: 'a', label: 'Eerste' }]}
        value="a"
        onChange={() => {}}
        labelProps={{ 'data-testid': 'Test-label' }}
      />,
    );
    return screen.getByTestId('Test-label').className;
  };

  test('an unselected segment gets the tint', async () => {
    assert.match(await mediaFor(segments(), hovering), tint);
  });

  test('the selected segment darkens', async () => {
    assert.match(await mediaFor(segments(), hovering), /--tw-brightness: brightness\(95%\)/);
  });
});

describe('hover-feedback › Hovering a disabled control', () => {
  test('the tint skips a disabled control', async () => {
    assert.match(await mediaFor(hoverTint, hovering), /:hover:not\(:disabled\)/);
  });

  test('the darkening skips a disabled control', async () => {
    assert.match(await mediaFor(hoverDarken, hovering), /:hover:not\(:disabled\)/);
  });
});

describe('hover-feedback › Hovering a plain text link', () => {
  test('the text is underlined', async () => {
    assert.match(await mediaFor(hoverUnderline, hovering), /text-decoration-line: underline/);
  });
});

describe('hover-feedback › Hovering an underlined link', () => {
  test('the colour changes', async () => {
    assert.match(await mediaFor(hoverRecolor, hovering), /color: var\(--color-blu\)/);
  });
});

describe('hoverField', () => {
  test('the field gets the tint until it has focus', async () => {
    const css = await mediaFor(hoverField, hovering);
    assert.match(css, tint);
    assert.match(css, /:not\(:focus\)/);
  });
});

describe('hover-feedback › Touch screen', () => {
  test.each([hoverTint, hoverDarken, hoverUnderline, hoverRecolor])('%s only applies where the pointer can hover', async (classes) => {
    const css = await cssFor(classes);
    const outside = css.replace(/@media \(hover: hover\) \{[\s\S]*?\n {2}\}/, '');
    assert.doesNotMatch(outside, /:hover/);
  });
});
