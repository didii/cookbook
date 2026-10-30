import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import type { Lists } from './lists';
import { matches, rankRecipes, words } from './matchIngredients';

describe('words', () => {
  test('splits on anything that is not a letter or a digit', () => {
    assert.deepEqual(words('rijst (gekookt), 2x'), ['rijst', 'gekookt', '2x']);
  });

  test('folds case and accents', () => {
    assert.deepEqual(words('Crème Fraîche'), ['creme', 'fraiche']);
  });
});

describe('fridge-search › A whole word matches', () => {
  test('the entry matches the ingredient', () => {
    assert.ok(matches('kip', 'gekookte kip'));
  });
});

describe('fridge-search › Part of a word does not match', () => {
  test('the entry does not match the ingredient', () => {
    assert.ok(!matches('kip', 'kipfilet'));
  });

  test('the end of a word does not match either', () => {
    assert.ok(!matches('ui', 'pruimen'));
  });
});

describe('fridge-search › Case and accents are ignored', () => {
  test('the entry matches the ingredient', () => {
    assert.ok(matches('creme fraiche', 'Crème fraîche'));
  });
});

const lists = (change: Partial<Lists>): Lists => ({ heb: [], zonder: [], sort: 'nieuwste', ...change });
const recipe = (slug: string, title = slug) => ({ slug, title });
const slugs = (found: { recipe: { slug: string } }[]) => found.map((r) => r.recipe.slug);

describe('fridge-search › An entry of several words', () => {
  test('the entry matches the ingredient with the words next to each other', () => {
    assert.ok(matches('rode ui', 'rode ui'));
  });

  test('the entry does not match a lone ui or a rode wijn', () => {
    assert.ok(!matches('rode ui', 'ui'));
    assert.ok(!matches('rode ui', 'rode wijn'));
  });

  test('the words must be in the same order', () => {
    assert.ok(!matches('rode ui', 'ui rode'));
  });

  test('only the recipe with the ingredient "rode ui" is found', () => {
    const found = rankRecipes([recipe('a'), recipe('b')], { a: ['rode ui'], b: ['ui', 'rode wijn'] }, lists({ heb: ['rode ui'] }), []);
    assert.deepEqual(slugs(found), ['a']);
  });

  test('empty text matches nothing', () => {
    assert.ok(!matches('  ', 'ui'));
  });
});

describe('fridge-search › Recipes without a match are hidden', () => {
  test('only the recipe with the ingredient is shown', () => {
    const found = rankRecipes([recipe('a'), recipe('b'), recipe('c')], { a: ['ui'], b: ['kip'], c: ['rijst'] }, lists({ heb: ['kip'] }), []);
    assert.deepEqual(slugs(found), ['b']);
  });
});

describe('fridge-search › More matches first', () => {
  test('the recipe with both entries is before the newer one with one', () => {
    // A is newer than B: recipes come newest first.
    const found = rankRecipes([recipe('a'), recipe('b')], { a: ['rijst'], b: ['rijst', 'melk'] }, lists({ heb: ['rijst', 'melk'] }), []);
    assert.deepEqual(slugs(found), ['b', 'a']);
  });
});

describe('fridge-search › Same number of matches keep the chosen order', () => {
  const recipes = [recipe('x', 'Zout'), recipe('y', 'appel')];
  const names = { x: ['rijst'], y: ['melk'] };

  test('newest first', () => {
    assert.deepEqual(slugs(rankRecipes(recipes, names, lists({ heb: ['rijst', 'melk'] }), [])), ['x', 'y']);
  });

  test('by title when A–Z is selected', () => {
    assert.deepEqual(slugs(rankRecipes(recipes, names, lists({ heb: ['rijst', 'melk'], sort: 'az' }), [])), ['y', 'x']);
  });
});

describe('fridge-search › Liever niet removes recipes', () => {
  test('the other two recipes are shown', () => {
    const found = rankRecipes(
      [recipe('a'), recipe('b'), recipe('c')],
      { a: ['spruitjes'], b: ['kip'], c: ['rijst'] },
      lists({ zonder: ['spruitjes'] }),
      [],
    );
    assert.deepEqual(slugs(found), ['b', 'c']);
  });
});

describe('fridge-search › Liever niet beats Heb ik', () => {
  test('the recipe with both is not shown', () => {
    const found = rankRecipes([recipe('a')], { a: ['kip', 'ui'] }, lists({ heb: ['kip'], zonder: ['ui'] }), []);
    assert.deepEqual(slugs(found), []);
  });
});

describe('fridge-search › An entry counts once', () => {
  test('the recipe counts one match', () => {
    const [found] = rankRecipes([recipe('a')], { a: ['kip', 'gekookte kip'] }, lists({ heb: ['kip'] }), []);
    assert.deepEqual(found?.used, ['kip']);
  });
});

describe('fridge-search › Choosing the order', () => {
  test('without Heb ik entries the order applies to the whole list', () => {
    const recipes = [recipe('x', 'Zoute soep'), recipe('y', 'Appeltaart')];
    assert.deepEqual(slugs(rankRecipes(recipes, {}, lists({ sort: 'az' }), [])), ['y', 'x']);
  });

  test('accents and case are ignored in the title', () => {
    const recipes = [recipe('x', 'zout'), recipe('y', 'Éclair'), recipe('z', 'Appel')];
    assert.deepEqual(slugs(rankRecipes(recipes, {}, lists({ sort: 'az' }), [])), ['z', 'y', 'x']);
  });
});

describe('rankRecipes used, unused and missing', () => {
  const names = { a: ['rijst', 'melk', 'kaneel', 'zout', 'Melk'] };

  test('used and unused split the Heb ik entries', () => {
    const [found] = rankRecipes([recipe('a')], names, lists({ heb: ['rijst', 'ei'] }), []);
    assert.deepEqual([found?.used, found?.unused], [['rijst'], ['ei']]);
  });

  test('missing has the ingredients that nothing matches, in recipe order, each once', () => {
    const [found] = rankRecipes([recipe('a')], names, lists({ heb: ['rijst'] }), []);
    assert.deepEqual(found?.missing, ['melk', 'kaneel', 'zout']);
  });

  test('a staple is not missing', () => {
    const [found] = rankRecipes([recipe('a')], names, lists({ heb: ['rijst'] }), ['zout']);
    assert.deepEqual(found?.missing, ['melk', 'kaneel']);
  });

  test('a staple typed in Heb ik matches like any other entry', () => {
    const found = rankRecipes([recipe('a')], { a: ['boter'] }, lists({ heb: ['boter'] }), ['boter']);
    assert.deepEqual(found[0]?.used, ['boter']);
  });

  test('a recipe without ingredients has none', () => {
    const [found] = rankRecipes([recipe('a')], {}, lists({}), []);
    assert.deepEqual(found?.missing, []);
  });
});

describe('fridge-search › Staples are not missing', () => {
  test('a staple is not listed, the other ingredient is', () => {
    const [found] = rankRecipes([recipe('a')], { a: ['rijst', 'boter'] }, lists({ heb: ['rijst'] }), ['boter']);
    assert.deepEqual(found?.missing, []);
  });
});

describe('staple-management › A staple is not listed as missing', () => {
  test('the recipe with the ingredient "zout" lists no zout', () => {
    const [found] = rankRecipes([recipe('a')], { a: ['zout', 'kip'] }, lists({ heb: ['kip'] }), ['zout']);
    assert.deepEqual(found?.missing, []);
  });
});

describe('staple-management › A staple typed in Heb ik', () => {
  test('recipes with the ingredient match it like any other entry', () => {
    const found = rankRecipes([recipe('a'), recipe('b')], { a: ['boter'], b: ['kip'] }, lists({ heb: ['boter'] }), ['boter']);
    assert.deepEqual(slugs(found), ['a']);
  });
});
