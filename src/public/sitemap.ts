import { GAMES } from '../games/registry';
import { SITE_URL } from '../ui/seo';
import { POSTS } from './posts';

// Every public page, for public/sitemap.xml (site polish, 2026-11-21). The
// sitemap test fails when a page or post is added and the file is not
// refreshed: run `UPDATE_SITEMAP=1 npx vitest run src/public/sitemap.test.ts`.
const PAGES = ['/', '/features', '/pricing', '/schools', '/homeschool', '/student-data', '/themes', '/research', '/blog', '/faq', '/help', '/it',
  '/challenge', '/beta', '/join', '/login', '/accessibility', '/accessibility/report', '/privacy', '/terms', '/subprocessors', '/dpa', '/credits', '/status', '/pricing/purchase-order'];

export function sitemapPaths(): string[] {
  return [
    ...PAGES,
    ...POSTS.map((p) => `/blog/${p.slug}`),
    ...GAMES.map((g) => `/blog/how-to-play/${g.id}`),
    ...GAMES.map((g) => `/blog/themes/${g.id}`),
  ];
}

export function sitemapXml(): string {
  const urls = sitemapPaths().map((p) => `  <url><loc>${SITE_URL}${p}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
