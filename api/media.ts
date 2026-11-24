// GIF and photo search for teachers (teacher, 2026-11-23): GIPHY for GIFs and
// Unsplash for photos, through this server so the API keys stay secret.
// Family-safe only: GIPHY rating "g", Unsplash content_filter "high".
// Only the search words come here, never anything about a student.
// Vercel env: GIPHY_API_KEY, UNSPLASH_ACCESS_KEY. Without one, that tab
// tells the teacher it is not switched on yet.
const GIPHY = process.env.GIPHY_API_KEY;
const UNSPLASH = process.env.UNSPLASH_ACCESS_KEY;

export interface MediaItem {
  id: string;
  source: 'giphy' | 'unsplash';
  url: string; // the picture to save on the question
  preview: string; // a small version for the search grid
  still?: string; // GIFs: a still frame, for the Still pictures setting
  width: number;
  height: number;
  alt: string;
  credit?: { name: string; link: string };
  // Unsplash asks apps to ping this when a photo is used.
  download?: string;
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': status === 200 ? 'public, max-age=300' : 'no-store' } });

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const from = request.headers.get('referer') ?? '';
  if (from && !from.startsWith(`${url.protocol}//${url.host}`)) return json({ error: 'forbidden' }, 403);
  const kind = url.searchParams.get('kind');
  const q = (url.searchParams.get('q') ?? '').trim().slice(0, 60);
  const page = Math.max(0, Math.min(20, Number(url.searchParams.get('page') ?? 0) || 0));

  if (kind === 'track') {
    // Unsplash download ping (their API guidelines), only for their own links.
    const loc = url.searchParams.get('loc') ?? '';
    if (!UNSPLASH || !loc.startsWith('https://api.unsplash.com/')) return json({ ok: false }, 400);
    await fetch(loc, { headers: { Authorization: `Client-ID ${UNSPLASH}` } }).catch(() => undefined);
    return json({ ok: true });
  }

  if (kind === 'gif') {
    if (!GIPHY) return json({ error: 'setup' }, 503);
    const endpoint = q ? 'search' : 'trending';
    const params = new URLSearchParams({ api_key: GIPHY, limit: '24', offset: String(page * 24), rating: 'g', lang: 'en', bundle: 'messaging_non_clips' });
    if (q) params.set('q', q);
    const res = await fetch(`https://api.giphy.com/v1/gifs/${endpoint}?${params}`);
    if (!res.ok) return json({ error: 'giphy' }, 502);
    const body = (await res.json()) as { data: { id: string; title: string; alt_text?: string; images: Record<string, { url: string; width: string; height: string }> }[] };
    const items: MediaItem[] = body.data.map((g) => ({
      id: g.id, source: 'giphy',
      url: g.images.downsized_medium?.url ?? g.images.original.url,
      preview: g.images.fixed_width?.url ?? g.images.original.url,
      still: g.images.downsized_still?.url ?? g.images.fixed_width_still?.url,
      width: Number(g.images.original.width), height: Number(g.images.original.height),
      alt: (g.alt_text || g.title || 'GIF').replace(/\s*GIF\s*by.*$/i, '').trim() || 'GIF',
    }));
    return json({ items });
  }

  if (kind === 'photo') {
    if (!UNSPLASH) return json({ error: 'setup' }, 503);
    if (!q) return json({ items: [] });
    const params = new URLSearchParams({ query: q, per_page: '24', page: String(page + 1), content_filter: 'high', orientation: 'landscape' });
    const res = await fetch(`https://api.unsplash.com/search/photos?${params}`, { headers: { Authorization: `Client-ID ${UNSPLASH}`, 'Accept-Version': 'v1' } });
    if (!res.ok) return json({ error: 'unsplash' }, 502);
    const body = (await res.json()) as { results: { id: string; alt_description?: string; description?: string; width: number; height: number; urls: { regular: string; small: string }; links: { download_location: string }; user: { name: string; links: { html: string } } }[] };
    const ref = '?utm_source=gamify&utm_medium=referral';
    const items: MediaItem[] = body.results.map((p) => ({
      id: p.id, source: 'unsplash', url: p.urls.regular, preview: p.urls.small, width: p.width, height: p.height,
      alt: p.alt_description || p.description || q,
      credit: { name: p.user.name, link: `${p.user.links.html}${ref}` },
      download: p.links.download_location,
    }));
    return json({ items });
  }

  return json({ error: 'kind' }, 400);
}
