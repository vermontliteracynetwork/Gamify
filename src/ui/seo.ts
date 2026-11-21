import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { APP_DOMAIN } from '../config';
import { trailFor } from './Breadcrumbs';
import { pageDescription, pageTitle } from './pageTitle';

// Search and share tags for every page (site polish, 2026-11-21): the tab
// title, description, canonical address, link-preview card and breadcrumb
// structured data. Teacher, student and game screens are kept out of search
// (they are behind sign-in or a code), and so is every non-production copy
// of the site (preview links), so only learngamify.com is ever indexed.
export const SITE_URL = `https://${APP_DOMAIN}`;
const SHARE_IMAGE = `${SITE_URL}/og-image.png`;
const PRIVATE = /^\/(teacher|owner|join\/|show\/|live\/|games\/|play|arcade|choose|mirror\/|look-up|check$|beta-kit|challenge\/permission|teacher-time)/;

function tag(sel: string, make: () => HTMLElement): HTMLElement {
  let el = document.head.querySelector<HTMLElement>(sel);
  if (!el) { el = make(); document.head.appendChild(el); }
  return el;
}
const meta = (attr: 'name' | 'property', key: string, value: string) => {
  const el = tag(`meta[${attr}="${key}"]`, () => { const m = document.createElement('meta'); m.setAttribute(attr, key); return m; });
  el.setAttribute('content', value);
};

export function isProductionHost(host = window.location.host) {
  return host === APP_DOMAIN || host === `www.${APP_DOMAIN}`;
}

// A page can name itself (a blog post's title and summary): it wins over the
// route's default title for that path only.
const own = new Map<string, { title: string; description?: string; noindex?: boolean }>();
export function usePageMeta(title: string | undefined, description?: string, noindex = false) {
  const { pathname } = useLocation();
  useEffect(() => {
    if (!title) return;
    own.set(pathname, { title, description, noindex });
    applySeo(pathname);
    return () => { own.delete(pathname); };
  }, [pathname, title, description, noindex]);
}

export function applySeo(path: string) {
  const mine = own.get(path);
  const title = mine ? `${mine.title} | Gamify` : pageTitle(path);
  const description = mine?.description ?? pageDescription(path);
  const url = `${SITE_URL}${path === '/' ? '/' : path.replace(/\/$/, '')}`;
  document.title = title;
  meta('name', 'description', description);
  const canonical = tag('link[rel="canonical"]', () => { const l = document.createElement('link'); l.rel = 'canonical'; return l; });
  canonical.setAttribute('href', url);
  meta('name', 'robots', !isProductionHost() || PRIVATE.test(path) || mine?.noindex ? 'noindex, nofollow' : 'index, follow');
  meta('property', 'og:title', title);
  meta('property', 'og:description', description);
  meta('property', 'og:url', url);
  meta('property', 'og:image', SHARE_IMAGE);
  meta('property', 'og:image:alt', 'Gamify: classroom games made from your own questions');
  meta('name', 'twitter:card', 'summary_large_image');
  meta('name', 'twitter:title', title);
  meta('name', 'twitter:description', description);
  meta('name', 'twitter:image', SHARE_IMAGE);
  // Breadcrumbs for search results (no trail is drawn on the page: teacher, 2026-11-08).
  const trail = PRIVATE.test(path) ? null : trailFor(path, false);
  const old = document.getElementById('ld-breadcrumbs');
  if (!trail || trail.length < 2) { old?.remove(); return; }
  const ld = old ?? Object.assign(document.createElement('script'), { id: 'ld-breadcrumbs', type: 'application/ld+json' });
  ld.textContent = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: trail.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.label, item: `${SITE_URL}${c.to ?? path}` })),
  });
  if (!old) document.head.appendChild(ld);
}
