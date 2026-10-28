import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import '~testing/dom';
import { readRecipe } from './readRecipe';

const address = 'https://example.com/recepten/soep';
const block = (data: unknown) => `<script type="application/ld+json">${typeof data === 'string' ? data : JSON.stringify(data)}</script>`;
const page = (...blocks: string[]) => `<!doctype html><html><head><title>Soep</title>${blocks.join('')}</head><body><h1>Soep</h1></body></html>`;
const read = (data: unknown) => readRecipe(page(block(data)), address);
const recipe = (extra: Record<string, unknown> = {}) => ({ '@context': 'https://schema.org', '@type': 'Recipe', name: 'Tomatensoep', ...extra });

describe('recipe-import › Page without a recipe', () => {
  test('a page without structured data gives undefined', () => {
    assert.equal(readRecipe('<html><body><p>Hallo</p></body></html>', address), undefined);
  });

  test('structured data of another type gives undefined', () => {
    assert.equal(read({ '@type': 'Article', name: 'Nieuws' }), undefined);
  });

  test('a Recipe without name, ingredients or steps gives undefined', () => {
    assert.equal(read(recipe({ name: '', description: 'Lekker' })), undefined);
  });

  test('data that is not JSON gives undefined', () => {
    assert.equal(readRecipe(page(block('{ not json')), address), undefined);
  });
});

describe('recipe-import › Partly filled recipe', () => {
  const partly = read(recipe());

  test('a recipe with only a name keeps the text fields empty', () => {
    assert.deepEqual(partly, {
      title: 'Tomatensoep',
      intro: '',
      servingsText: '',
      minutes: undefined,
      ingredients: [],
      steps: [],
      image: undefined,
    });
  });
});

describe('readRecipe', () => {
  describe('finding the recipe', () => {
    test('finds it inside @graph', () => {
      assert.equal(read({ '@context': 'https://schema.org', '@graph': [{ '@type': 'WebSite' }, recipe()] })?.title, 'Tomatensoep');
    });

    test('finds it in a top-level array', () => {
      assert.equal(read([{ '@type': 'BreadcrumbList' }, recipe()])?.title, 'Tomatensoep');
    });

    test('finds it when @type is an array', () => {
      assert.equal(read(recipe({ '@type': ['Thing', 'Recipe'] }))?.title, 'Tomatensoep');
    });

    test('finds it with a full type address', () => {
      assert.equal(read(recipe({ '@type': 'https://schema.org/Recipe' }))?.title, 'Tomatensoep');
    });

    test('skips a broken block and a block without a recipe', () => {
      const html = page(block('{ broken'), block({ '@type': 'Organization' }), block(recipe()));
      assert.equal(readRecipe(html, address)?.title, 'Tomatensoep');
    });
  });

  describe('texts', () => {
    test('strips tags and entities from every text', () => {
      const r = read(
        recipe({
          name: 'Soep &amp; brood',
          description: '<p>Een <b>lekkere</b> soep.</p>',
          recipeIngredient: ['<span>2 el</span> olijfolie', '1&nbsp;ui'],
          recipeInstructions: ['Snij de <i>ui</i>.'],
        }),
      );
      assert.equal(r?.title, 'Soep & brood');
      assert.equal(r?.intro, 'Een lekkere soep.');
      assert.deepEqual(r?.ingredients, ['2 el olijfolie', '1 ui']);
      assert.deepEqual(r?.steps, ['Snij de ui.']);
    });

    test('drops empty ingredients and collapses whitespace', () => {
      assert.deepEqual(read(recipe({ recipeIngredient: ['  2   tomaten ', '', '   '] }))?.ingredients, ['2 tomaten']);
    });
  });

  describe('steps', () => {
    test('reads a list of strings', () => {
      assert.deepEqual(read(recipe({ recipeInstructions: ['Snijd.', 'Kook.'] }))?.steps, ['Snijd.', 'Kook.']);
    });

    test('reads HowToStep objects by text, else name', () => {
      const steps = [
        { '@type': 'HowToStep', text: 'Snijd.' },
        { '@type': 'HowToStep', name: 'Kook.' },
      ];
      assert.deepEqual(read(recipe({ recipeInstructions: steps }))?.steps, ['Snijd.', 'Kook.']);
    });

    test('flattens HowToSection groups in order', () => {
      const groups = [
        {
          '@type': 'HowToSection',
          name: 'Soep',
          itemListElement: [
            { '@type': 'HowToStep', text: 'Snijd.' },
            { '@type': 'HowToStep', text: 'Kook.' },
          ],
        },
        { '@type': 'HowToSection', name: 'Brood', itemListElement: [{ '@type': 'HowToStep', text: 'Bak.' }] },
      ];
      assert.deepEqual(read(recipe({ recipeInstructions: groups }))?.steps, ['Snijd.', 'Kook.', 'Bak.']);
    });

    test('splits one string on line breaks and drops numbering', () => {
      assert.deepEqual(read(recipe({ recipeInstructions: '1. Snijd de ui.\n2. Kook de soep.\n\n3) Serveer.' }))?.steps, [
        'Snijd de ui.',
        'Kook de soep.',
        'Serveer.',
      ]);
    });

    test('splits one string on <br> and paragraphs', () => {
      assert.deepEqual(read(recipe({ recipeInstructions: '<p>Snijd.</p><p>Kook.<br>Serveer.</p>' }))?.steps, ['Snijd.', 'Kook.', 'Serveer.']);
    });

    test('keeps a quantity at the start of a step', () => {
      assert.deepEqual(read(recipe({ recipeInstructions: ['2 uien snijden.'] }))?.steps, ['2 uien snijden.']);
    });
  });

  describe('servings text', () => {
    for (const [name, value, expected] of [
      ['a string', '4 porties', '4 porties'],
      ['a number', 4, '4'],
      ['a list', ['4', '4 porties'], '4'],
    ] as const) {
      test(`reads ${name}`, () => {
        assert.equal(read(recipe({ recipeYield: value }))?.servingsText, expected);
      });
    }
  });

  describe('time', () => {
    for (const [name, data, expected] of [
      ['total time', { totalTime: 'PT1H30M' }, 90],
      ['days, hours and minutes', { totalTime: 'P1DT2H5M' }, 1565],
      ['minutes only', { totalTime: 'PT45M' }, 45],
      ['preparation plus cooking without a total', { prepTime: 'PT15M', cookTime: 'PT1H' }, 75],
      ['cooking alone', { cookTime: 'PT20M' }, 20],
      ['the total over the parts', { totalTime: 'PT10M', prepTime: 'PT15M', cookTime: 'PT1H' }, 10],
      ['nothing readable', { totalTime: 'een uur' }, undefined],
      ['a zero duration', { totalTime: 'PT0M' }, undefined],
    ] as const) {
      test(`reads ${name}`, () => {
        assert.equal(read(recipe(data))?.minutes, expected);
      });
    }
  });

  describe('image', () => {
    for (const [name, value, expected] of [
      ['a string', 'https://cdn.example.com/a.jpg', 'https://cdn.example.com/a.jpg'],
      ['a list of strings', ['https://cdn.example.com/a.jpg', 'https://cdn.example.com/b.jpg'], 'https://cdn.example.com/a.jpg'],
      ['an ImageObject', { '@type': 'ImageObject', url: 'https://cdn.example.com/a.jpg' }, 'https://cdn.example.com/a.jpg'],
      ['a list of ImageObjects', [{ '@type': 'ImageObject', url: 'https://cdn.example.com/a.jpg' }], 'https://cdn.example.com/a.jpg'],
      ['a path on the page’s site', '/img/a.jpg', 'https://example.com/img/a.jpg'],
      ['an address without scheme', '//cdn.example.com/a.jpg', 'https://cdn.example.com/a.jpg'],
      ['something that is not a web address', 'data:image/png;base64,AAAA', undefined],
      ['an empty string', '', undefined],
    ] as const) {
      test(`reads ${name}`, () => {
        assert.equal(read(recipe({ image: value }))?.image, expected);
      });
    }
  });
});
