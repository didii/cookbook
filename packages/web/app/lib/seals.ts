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

/** Seal for a new recipe: random among the seals the fewest recipes use. `existing` holds the seal of every recipe. */
export function pickSeal(existing: string[], random = Math.random) {
  const count = (s: string) => existing.filter((e) => e === s).length;
  const least = Math.min(...seals.map(count));
  const pool = seals.filter((s) => count(s) === least);
  return pool[Math.floor(random() * pool.length)];
}
