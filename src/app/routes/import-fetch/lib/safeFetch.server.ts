export const maxRedirects = 5;
export const pageBytes = 5 * 1024 * 1024;
export const imageBytes = 2 * 1024 * 1024;
const timeout = 10_000;

type Failure = { ok: false; status: 400 | 403 | 413 | 415 | 502 | 504 };
export type Fetched = { ok: true; body: Uint8Array<ArrayBuffer>; contentType: string } | Failure;
type Options = {
  maxBytes: number;
  /** Accepts the media type of the response (without parameters, lower case). */
  accept: (mediaType: string) => boolean;
  fetch?: typeof fetch;
  timeoutMs?: number;
};

export const isHtml = (type: string) => type === 'text/html' || type === 'application/xhtml+xml';
export const isImage = (type: string) => ['image/jpeg', 'image/png', 'image/webp'].includes(type);

const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

function refusedIpv4([a, b, c]: number[]) {
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0 && (c === 0 || c === 2)) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113)
  );
}

/** The eight 16-bit groups of an IPv6 literal without brackets, or undefined when it does not parse. */
function ipv6Groups(literal: string): number[] | undefined {
  let text = literal;
  const dotted = /(\d+\.\d+\.\d+\.\d+)$/.exec(text)?.[1];
  if (dotted) {
    const m = ipv4.exec(dotted);
    if (!m) return undefined;
    const [, a, b, c, d] = m.map(Number);
    text = text.slice(0, -dotted.length) + ((a << 8) | b).toString(16) + ':' + ((c << 8) | d).toString(16);
  }
  const halves = text.split('::');
  if (halves.length > 2) return undefined;
  const part = (s: string) => (s ? s.split(':') : []);
  const head = part(halves[0]);
  const tail = halves.length === 2 ? part(halves[1]) : [];
  const fill = 8 - head.length - tail.length;
  if (halves.length === 1 ? fill !== 0 : fill < 1) return undefined;
  const groups = [...head, ...Array<string>(halves.length === 2 ? fill : 0).fill('0'), ...tail].map((g) => parseInt(g, 16));
  return groups.length === 8 && groups.every((g) => g >= 0 && g <= 0xffff) ? groups : undefined;
}

const embedded = (hi: number, lo: number) => [hi >> 8, hi & 255, lo >> 8, lo & 255];

function refusedIpv6(literal: string) {
  const g = ipv6Groups(literal);
  if (!g) return true;
  if (g.slice(0, 6).every((x) => x === 0)) return true; // ::, ::1 and the old IPv4-compatible range
  if (g.slice(0, 5).every((x) => x === 0) && g[5] === 0xffff) return refusedIpv4(embedded(g[6], g[7])); // IPv4-mapped
  if (g[0] === 0x64 && g[1] === 0xff9b) return refusedIpv4(embedded(g[6], g[7])); // NAT64
  if (g[0] === 0x2002) return refusedIpv4(embedded(g[1], g[2])); // 6to4
  return (
    (g[0] & 0xfe00) === 0xfc00 || // unique local
    (g[0] & 0xffc0) === 0xfe80 || // link-local
    (g[0] & 0xff00) === 0xff00 || // multicast
    (g[0] === 0x2001 && g[1] === 0x0db8) // documentation
  );
}

// ponytail: names are judged by their text, not by what they resolve to (a Worker has no DNS lookup). Fine while the Worker runs on Cloudflare's edge, which cannot reach a private network; add a resolver check if the app ever fetches from inside one.
/** True when the address may not be fetched: not http(s), has credentials, or points at this machine or a private network. */
export function refusedAddress(url: URL) {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return true;
  if (url.username || url.password) return true;
  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  if (host.startsWith('[')) return refusedIpv6(host.slice(1, -1));
  const v4 = ipv4.exec(host);
  if (v4) return refusedIpv4(v4.slice(1).map(Number));
  return host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal') || !host;
}

async function readCapped(response: Response, maxBytes: number) {
  if (Number(response.headers.get('Content-Length')) > maxBytes) return undefined;
  const chunks: Uint8Array[] = [];
  let size = 0;
  const reader = response.body?.getReader();
  while (reader) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      return undefined;
    }
    chunks.push(value);
  }
  const body = new Uint8Array(size);
  let at = 0;
  for (const chunk of chunks) {
    body.set(chunk, at);
    at += chunk.byteLength;
  }
  return body;
}

/** Fetches `address` (GET) for the import: http(s) only, no private addresses (on every redirect hop), capped in redirects, size and time. */
export async function safeFetch(address: string, { maxBytes, accept, fetch: doFetch = fetch, timeoutMs = timeout }: Options): Promise<Fetched> {
  let url: URL;
  try {
    url = new URL(address);
  } catch {
    return { ok: false, status: 400 };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    for (let hop = 0; ; hop++) {
      if (refusedAddress(url)) return { ok: false, status: 403 };
      if (hop > maxRedirects) return { ok: false, status: 502 };
      const response = await doFetch(url, {
        redirect: 'manual',
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Kookboek/1.0)', Accept: '*/*' },
      });
      const location = response.headers.get('Location');
      if (response.status >= 300 && response.status < 400 && location) {
        await response.body?.cancel();
        try {
          url = new URL(location, url);
        } catch {
          return { ok: false, status: 502 };
        }
        continue;
      }
      if (!response.ok) return { ok: false, status: 502 };
      const contentType = (response.headers.get('Content-Type') ?? '').split(';')[0].trim().toLowerCase();
      if (!accept(contentType)) return { ok: false, status: 415 };
      const body = await readCapped(response, maxBytes);
      return body ? { ok: true, body, contentType } : { ok: false, status: 413 };
    }
  } catch {
    return { ok: false, status: controller.signal.aborted ? 504 : 502 };
  } finally {
    clearTimeout(timer);
  }
}
