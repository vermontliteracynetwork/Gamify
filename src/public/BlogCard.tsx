import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from '@phosphor-icons/react';
import { Doodle, type DoodleKind } from '../brand/CrayonKit';
import { GameCover } from '../games/covers';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';

// One pastel header and one doodle per card (a predictable grid with one
// accent per card helps scanning; dual coding helps memory).
const CARD_BG = ['bg-butter', 'bg-blush', 'bg-mint', 'bg-blue-crystal', 'bg-peach', 'bg-lavender'];
const DOODLES: [DoodleKind, string][] = [['sparkle', '#fabe37'], ['star', '#f055a5'], ['heart', '#4ba3e8']];
export function PostHeader({ i, tall }: { i: number; tall?: boolean }) {
  const [kind, color] = DOODLES[i % DOODLES.length];
  return (
    <span aria-hidden="true" className={`${CARD_BG[i % CARD_BG.length]} ${tall ? 'h-48 sm:h-60 rounded-panel border-bold shadow-[var(--shadow-sticker)]' : 'h-36 border-b-[2.5px]'} border-border grid place-items-center`}>
      <Doodle kind={kind} color={color} size={tall ? 110 : 66} />
    </span>
  );
}

// The card every blog list uses: a header on top, the title, a line, the
// details and "Read it".
export function BlogCard({ to, header, title, sub, meta }: { to: string; header: ReactNode; title: string; sub: string; meta?: ReactNode }) {
  return (
    <Link to={to} className="hover-lift rounded-panel bg-surface border-bold border-border no-underline text-text overflow-hidden flex flex-col" style={{ boxShadow: 'var(--shadow-sticker)' }}>
      {header}
      <span className="p-5 flex flex-col gap-2 flex-1">
        <span className="font-heading font-bold text-xl leading-tight">{title}</span>
        <span className="font-semibold text-sm leading-snug">{sub}</span>
        {meta}
        <span className="mt-auto pt-1 font-bold text-sm inline-flex items-center gap-1.5">{t('ways.read')}<ArrowRight weight="bold" size={16} aria-hidden="true" /></span>
      </span>
    </Link>
  );
}

// Numbered steps with a round Butter number (the Blog post mockup).
export function Steps({ items, label }: { items: string[]; label?: (n: number) => string }) {
  return (
    <ol className="grid gap-4 list-none p-0 m-0">
      {items.map((s, i) => (
        <li key={i} className="grid grid-cols-[2.75rem_1fr] gap-3 items-start">
          <span className="w-11 h-11 rounded-full bg-butter border-std border-border grid place-items-center font-score text-xl" aria-label={label?.(i + 1)}>{i + 1}</span>
          <span className="text-lg font-semibold leading-relaxed pt-1.5">{s}</span>
        </li>
      ))}
    </ol>
  );
}


// A game's own art as a card header (theme guides and How to play cards), so
// a reader sees which game it is at a glance.
export function GameHeader({ gameId }: { gameId: string }) {
  return <span className="block h-36 overflow-hidden border-b-[2.5px] border-border"><GameCover gameId={gameId} className="w-full h-full cover-zoom" /></span>;
}

export type Topic = 'all' | 'classroom' | 'themes' | 'howto' | 'homeschool';
// "Blog / Classroom ideas" over a post (the /brand Blog post mockup): plain
// links back, not a full trail.
export function BlogCrumb({ topic }: { topic: Topic }) {
  return (
    <nav aria-label={t('ways.crumb')} className="text-sm font-bold text-muted">
      <Link to="/blog" className="text-muted no-underline hover:underline">{t('ways.title')}</Link>
      <span aria-hidden="true"> / </span>
      <Link to={`/blog?tag=${topic}`} className="text-muted no-underline hover:underline">{t(`ways.topic.${topic}` as StringKey)}</Link>
    </nav>
  );
}

