import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import type { Recipe } from '~app/shared/recipe';
import { render, screen } from '~testing/dom';
import { RecipeHead } from './RecipeHead';

const recipe: Pick<Recipe, 'title' | 'author' | 'time' | 'servings' | 'source' | 'intro' | 'image' | 'seal'> = {
  title: 'Appeltaart',
  author: 'Oma',
  time: null,
  servings: null,
  intro: 'Zoet',
  image: null,
  source: null,
  seal: null,
};

const page = (props: Partial<typeof recipe> = {}) => render(<RecipeHead recipe={{ ...recipe, ...props }} tile={0} />);

describe('recipe-viewing › Optional fields are empty', () => {
  // No time, no servings and no image: the page still renders, without them.
  test('the title and author still show', () => {
    page();
    assert.equal(screen.getByTestId('RecipeHead-title').textContent, 'Appeltaart');
    assert.equal(screen.getByTestId('RecipeHead-author').textContent, 'van Oma');
  });

  test('no time, servings or image show', () => {
    page();
    assert.equal(screen.queryByTestId('RecipeHead-time'), null);
    assert.equal(screen.queryByTestId('RecipeHead-servings'), null);
    assert.equal(screen.queryByTestId('RecipeHead-image'), null);
  });

  test('with them, the time and servings are shown', () => {
    page({ time: '1 uur', servings: 6, image: '/taart.jpg' });
    assert.equal(screen.getByTestId('RecipeHead-time').textContent, '1 uur');
    assert.equal(screen.getByTestId('RecipeHead-servings').textContent, '6 porties');
  });

  test('with them, the image is shown', () => {
    page({ time: '1 uur', servings: 6, image: '/taart.jpg' });
    assert.ok(screen.getByTestId('RecipeHead-image'));
  });
});

const withSource = (source: string | null) => page({ source });
const shown = () => screen.getByTestId('RecipeHead-source');

describe('recipe-source › Text source', () => {
  test('the text is shown', () => {
    withSource('Buurvrouw Marie');
    assert.equal(shown().textContent, 'Buurvrouw Marie');
  });

  test('it is not a link', () => {
    withSource('Buurvrouw Marie');
    assert.equal(shown().getAttribute('href'), null);
  });
});

describe('recipe-source › Link source', () => {
  const address = 'https://www.smulweb.nl/recepten/123/appeltaart';

  test('the link goes to the address', () => {
    withSource(address);
    assert.equal(shown().getAttribute('href'), address);
  });

  test('the text is the host', () => {
    withSource(address);
    assert.equal(shown().textContent, 'smulweb.nl');
  });

  test('it opens in a new tab', () => {
    withSource(address);
    assert.equal(shown().getAttribute('target'), '_blank');
  });

  test('it passes no referrer or opener', () => {
    withSource(address);
    assert.equal(shown().getAttribute('rel'), 'noopener noreferrer');
  });
});

describe('recipe-source › Other schemes are not links', () => {
  for (const source of ['javascript:alert(1)', 'ftp://example.com/x'])
    test(`${source} is plain text`, () => {
      withSource(source);
      assert.deepEqual([shown().textContent, shown().getAttribute('href')], [source, null]);
    });
});

describe('recipe-source › Text containing a link', () => {
  test('it is plain text', () => {
    withSource('zie https://example.com');
    assert.deepEqual([shown().textContent, shown().getAttribute('href')], ['zie https://example.com', null]);
  });
});

describe('recipe-source › Recipe without a source', () => {
  test('the page has no source item', () => {
    withSource(null);
    assert.equal(screen.queryByTestId('RecipeHead-source'), null);
  });
});
