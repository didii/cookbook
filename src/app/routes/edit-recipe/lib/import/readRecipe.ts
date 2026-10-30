/** What a page's schema.org `Recipe` gave, as plain text. A field the page lacks is empty (or undefined for minutes and image). */
export type ImportedRecipe = {
  title: string;
  intro: string;
  /** The yield as the page writes it, e.g. "4 porties". */
  servingsText: string;
  minutes: number | undefined;
  ingredients: string[];
  steps: string[];
  /** Absolute http(s) address of the image. */
  image: string | undefined;
};

type Json = Record<string, unknown>;

const isRecord = (value: unknown): value is Json => typeof value === 'object' && value !== null && !Array.isArray(value);
const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : value === undefined || value === null ? [] : [value]);

const isRecipe = (node: Json) => list(node['@type']).some((t) => typeof t === 'string' && /(^|[/:])Recipe$/.test(t));

/** The first node that is a Recipe, looking at the top level, in arrays and inside `@graph`. */
function findRecipe(value: unknown): Json | undefined {
  for (const node of list(value)) {
    if (!isRecord(node)) continue;
    if (isRecipe(node)) return node;
    const inGraph = findRecipe(node['@graph']);
    if (inGraph) return inGraph;
  }
  return undefined;
}

/** Text without tags and entities; line breaks and paragraph ends become newlines, other whitespace runs one space. */
function plain(value: unknown): string {
  if (typeof value === 'number') return String(value);
  if (typeof value !== 'string') return '';
  const marked = value.replace(/<\s*br\s*\/?>|<\/\s*(p|li|div)\s*>/gi, '\n');
  const text = new DOMParser().parseFromString(marked, 'text/html').body.textContent ?? '';
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

const oneLine = (value: unknown) => plain(value).replace(/\n/g, ' ');

/** ISO 8601 duration ("PT1H30M", "P0DT45M") to whole minutes. */
function minutesOf(value: unknown): number | undefined {
  const m =
    typeof value === 'string'
      ? /^P(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/i.exec(value.trim())
      : null;
  if (!m) return undefined;
  const [d, h, min, s] = m.slice(1).map(Number);
  const total = Math.round((d || 0) * 1440 + (h || 0) * 60 + (min || 0) + (s || 0) / 60);
  return total > 0 ? total : undefined;
}

/** Total time, else preparation plus cooking. */
function timeOf(recipe: Json) {
  const total = minutesOf(recipe.totalTime);
  if (total) return total;
  const parts = [minutesOf(recipe.prepTime), minutesOf(recipe.cookTime)].filter((n): n is number => n !== undefined);
  return parts.length ? parts.reduce((a, b) => a + b) : undefined;
}

/** Steps from a string (one per line, numbering dropped), a list, `HowToStep`s or `HowToSection`s (flattened). */
function stepsOf(value: unknown): string[] {
  if (typeof value === 'string') return plain(value).split('\n').map(withoutNumber).filter(Boolean);
  return list(value).flatMap((item) => {
    if (typeof item === 'string') return [withoutNumber(oneLine(item))].filter(Boolean);
    if (!isRecord(item)) return [];
    if (item.itemListElement !== undefined) return stepsOf(item.itemListElement);
    return [withoutNumber(oneLine(item.text || item.name))].filter(Boolean);
  });
}

const withoutNumber = (line: string) => line.replace(/^\d+\s*[.)]\s+/, '');

/** The first address of a string, a list, an `ImageObject` or a list of them, made absolute against the page. */
function imageOf(value: unknown, page: string): string | undefined {
  const first = list(value)[0];
  const address = isRecord(first) ? (first.url ?? first.contentUrl) : first;
  if (typeof address !== 'string' || !address.trim()) return undefined;
  try {
    const url = new URL(address.trim(), page);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : undefined;
  } catch {
    return undefined;
  }
}

/** Reads the recipe a page publishes as schema.org JSON-LD, or undefined when it has none. Runs in the browser (needs `DOMParser`). */
export function readRecipe(html: string, url: string): ImportedRecipe | undefined {
  const document = new DOMParser().parseFromString(html, 'text/html');
  let recipe: Json | undefined;
  for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      recipe = findRecipe(JSON.parse(script.textContent ?? ''));
    } catch {
      continue; // a broken block does not hide a good one
    }
    if (recipe) break;
  }
  if (!recipe) return undefined;
  const read = {
    title: oneLine(recipe.name),
    intro: plain(recipe.description),
    servingsText: oneLine(list(recipe.recipeYield)[0]),
    minutes: timeOf(recipe),
    ingredients: list(recipe.recipeIngredient)
      .map((i) => oneLine(i))
      .filter(Boolean),
    steps: stepsOf(recipe.recipeInstructions),
    image: imageOf(recipe.image, url),
  };
  // A Recipe node with no name, ingredients or steps gives nothing to fill in.
  return read.title || read.ingredients.length || read.steps.length ? read : undefined;
}
