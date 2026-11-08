import { useEffect, useSyncExternalStore } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CaretRight, House } from '@phosphor-icons/react';
import { getGame } from '../games/registry';
import { useSignedIn } from '../auth/session';
import { t } from '../i18n';
import { pageName } from './pageTitle';

// Breadcrumb trails (teacher, 2026-10-31: "add breadcrumb trails so its easy
// to go back") and every new page opening at the top of the screen. Game,
// join and live screens have none: students have nowhere to wander and game
// screens never scroll.
interface Crumb { label: string; to?: string }

// A page can name its last crumb (a blog post's title, a class's name).
let named: { path: string; label: string } | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
export function useCrumbLabel(label: string | undefined) {
  const { pathname } = useLocation();
  useEffect(() => {
    if (!label) return;
    named = { path: pathname, label }; emit();
    return () => { if (named?.path === pathname) { named = null; emit(); } };
  }, [label, pathname]);
}

const NONE = /^\/($|join|choose|look-up|games\/|live\/|teacher\/live|mirror\/|show\/|owner|arcade|check$|teacher\/classes\/?$|teacher\/?$|teacher\/themes\/[^/]+|teacher\/classes\/[^/]+\/check-in|blog\/themes\/[^/]+\/print)/;

const humanize = (slug: string) => { const s = slug.replace(/-/g, ' '); return s.charAt(0).toUpperCase() + s.slice(1); };

export function trailFor(path: string, teacher: boolean, label?: string): Crumb[] | null {
  if (NONE.test(path)) return null;
  const home: Crumb = teacher && (path.startsWith('/teacher') || path === '/play') ? { label: t('nav.teacher'), to: '/teacher' } : { label: t('public.nav.home'), to: '/' };
  const blog: Crumb = { label: t('public.nav.ideas'), to: '/blog' };
  let m: RegExpMatchArray | null;
  if ((m = path.match(/^\/blog\/how-to-play\/([^/]+)/))) return [home, blog, { label: t('crumbs.howto'), to: '/blog?tag=howto' }, { label: getGame(m[1])?.name ?? humanize(m[1]) }];
  if ((m = path.match(/^\/blog\/themes\/([^/]+)/))) return [home, blog, { label: t('crumbs.themes'), to: '/blog?tag=themes' }, { label: getGame(m[1])?.name ?? humanize(m[1]) }];
  if ((m = path.match(/^\/(blog|ways)\/([^/]+)/))) return [home, blog, { label: label ?? humanize(m[2]) }];
  if (path === '/accessibility/report') return [home, { label: pageName('/accessibility')!, to: '/accessibility' }, { label: pageName(path)! }];
  if (path === '/challenge/permission') return [home, { label: pageName('/challenge')!, to: '/challenge' }, { label: pageName(path)! }];
  const sets: Crumb = { label: pageName('/teacher/sets')!, to: '/teacher/sets' };
  if (path === '/teacher/sets/import') return [home, sets, { label: pageName(path)! }];
  if (/^\/teacher\/(sets|library)\/./.test(path)) return [home, sets, { label: label ?? pageName(path)! }];
  if (/^\/teacher\/classes\/./.test(path)) return [home, { label: pageName('/teacher/classes')!, to: '/teacher/classes' }, { label: label ?? pageName(path)! }];
  const name = pageName(path);
  return name ? [home, { label: name }] : null;
}

const SHOW_TRAIL = false;

export default function Breadcrumbs() {
  const { pathname, hash } = useLocation();
  const { teacher } = useSignedIn();
  // Mounts with each new page (it sits inside the page's keyed wrapper), so
  // every page opens at the top unless the link points to a spot on it.
  useEffect(() => { if (!hash) window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // No visual breadcrumb trail (teacher, 2026-11-08); this only keeps
  // every page opening at the top.
  const label = useSyncExternalStore((l) => { listeners.add(l); return () => { listeners.delete(l); }; }, () => (named?.path === pathname ? named.label : undefined));
  const trail = SHOW_TRAIL ? trailFor(pathname, !!teacher, label) : null;
  if (!trail) return null;
  return (
    <nav aria-label={t('crumbs.label')} className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 -mb-3 relative z-10">
      <ol className="flex flex-wrap items-center gap-1 list-none p-0 m-0 text-sm font-bold">
        {trail.map((c, i) => (
          <li key={i} className="flex items-center gap-1 min-w-0">
            {i > 0 && <CaretRight weight="bold" size={14} className="text-muted shrink-0" aria-hidden="true" />}
            {c.to && i < trail.length - 1
              ? <Link to={c.to} className="inline-flex items-center gap-1.5 min-h-11 px-3 rounded-pill bg-surface/70 border-[1.5px] border-border-soft no-underline text-text hover:bg-surface hover:border-border">{i === 0 && <House weight="bold" size={16} aria-hidden="true" />}{c.label}</Link>
              : <span aria-current="page" className="px-2 truncate max-w-[60vw]">{c.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
