/** Seal files in /img/seal, named by pinyin: 1, 2 or 4 characters about home cooking. */
export const seals = [
  'jia',
  'shi',
  'wei',
  'xiang',
  'fu',
  'jia-wei',
  'mei-wei',
  'hao-chi',
  'tuan-yuan',
  'kai-fan',
  'jia-chang-bian-fan',
  'se-xiang-wei-mei',
  'hui-wei-wu-qiong',
  'suan-tian-ku-la',
  'he-jia-huan-le',
  'wu-gu-feng-deng',
];

const RECENT = 3;

/**
 * Seal for a new recipe: random among the least-used ones, skipping those on the last few recipes.
 * `existing` holds the seal of every recipe, oldest first. Lowers repeats next to each other, no guarantee.
 */
export function pickSeal(existing: string[], random = Math.random) {
  const recent = existing.slice(-RECENT);
  const count = (s: string) => existing.filter((e) => e === s).length;
  const open = seals.filter((s) => !recent.includes(s));
  const least = Math.min(...open.map(count));
  const pool = open.filter((s) => count(s) === least);
  return pool[Math.floor(random() * pool.length)];
}
