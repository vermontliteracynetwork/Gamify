// A small rate limiter for the API routes (teacher, 2026-11-20 security list:
// rate limit login, quotes and the voice). It counts tries per key (an IP,
// or an IP plus a username) in a sliding window. It lives in each server
// instance's memory, so it is a first line; Supabase Auth adds its own limits.
const hits = new Map<string, number[]>();

export function limited(key: string, max: number, windowMs: number, now = Date.now()): boolean {
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
  return list.length > max;
}

export const clientIp = (request: Request) => (request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
