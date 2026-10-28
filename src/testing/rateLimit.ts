/** A stand-in for the import rate limit: the first `limit` calls per key pass, then they are refused. There is no window; `reset` starts a new one. */
export function fakeRateLimit(limit = 30) {
  const counts = new Map<string, number>();
  return {
    allow: async (key: string) => {
      const n = (counts.get(key) ?? 0) + 1;
      counts.set(key, n);
      return n <= limit;
    },
    reset: () => counts.clear(),
  };
}
