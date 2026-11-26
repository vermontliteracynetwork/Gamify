import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from '@phosphor-icons/react';
import { CrayonPowerUp, Doodle, type DoodleKind, type PowerId } from '../brand/CrayonKit';
import { GameCover } from '../games/covers';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { Keep, sbCardLink } from './scrapbookA';

// Each card's header is art (the Scrapbook A Blog mockup, owner 2026-11-26):
// a pastel band with one crayon power-up sticker and four tiny crayon marks at
// its corners, never under the words. One accent per card helps scanning in a
// predictable grid; a picture beside the words helps memory (dual coding).
const CARD_BG = ['bg-butter', 'bg-blush', 'bg-mint', 'bg-blue-crystal', 'bg-peach', 'bg-lavender'];
const ART: PowerId[] = ['double-points', 'magnet', 'spin-wheel', 'hint', 'shield', 'treasure-chest'];
const MARKS: [DoodleKind, string, string][] = [['star', '#fabe37', 'left-[1.1rem] top-[0.9rem]'], ['heart', '#f055a5', 'right-[1.4rem] top-[1.4rem]'], ['dot', '#4ba3e8', 'left-[2.5rem] bottom-[1.6rem]'], ['star', '#22b04a', 'right-[1.6rem] bottom-[1.4rem]']];
export function PostHeader({ i }: { i: number }) {
  return (
    <span aria-hidden="true" className={`${CARD_BG[i % CARD_BG.length]} relative h-36 border-b-[3px] border-border grid place-items-center overflow-hidden`}>
      <CrayonPowerUp id={ART[i % ART.length]} size={84} sticker />
      {MARKS.map(([k, c, at], n) => <Doodle key={n} kind={k} color={c} size={k === 'dot' ? 14 : 18} className={`absolute ${at}`} />)}
    </span>
  );
}

// The picture at the top of a post: the post's game cover on a white mat, on
// a Butter band (the Scrapbook A Blog post mockup).
export function PostCover({ gameId }: { gameId: string }) {
  return (
    <span aria-hidden="true" className="h-[10.5rem] sm:h-[16.25rem] rounded-panel border-[3px] border-border bg-butter grid place-items-center overflow-hidden">
      <span className="block rounded-[1.125rem] p-2 sm:p-3 bg-white border-[3px] border-border">
        <span className="block w-[8rem] sm:w-[13rem] aspect-[10/9] overflow-hidden rounded-[0.625rem] border-bold border-border">
          <GameCover gameId={gameId} className="w-full h-full" />
        </span>
      </span>
    </span>
  );
}

// The card every blog list uses: a header on top, the title, a line, the
// details and "Read it" (white, 3px ink outline, Scrapbook A).
export function BlogCard({ to, header, title, sub, meta }: { to: string; header: ReactNode; title: string; sub: string; meta?: ReactNode }) {
  return (
    <Link to={to} className={`${sbCardLink} overflow-hidden flex flex-col`}>
      {header}
      <span className="p-5 flex flex-col gap-2 flex-1">
        <span className="font-heading font-bold text-xl sm:text-[1.4375rem] leading-tight"><Keep text={title} /></span>
        <span className="font-semibold text-base sm:text-lg leading-snug">{sub}</span>
        {meta}
        <span className="mt-auto pt-1 font-bold text-base sm:text-[1.0625rem] inline-flex items-center gap-1.5 underline underline-offset-4">{t('ways.read')}<ArrowRight weight="bold" size={16} aria-hidden="true" /></span>
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
  return <span className="block h-36 overflow-hidden border-b-[3px] border-border"><GameCover gameId={gameId} className="w-full h-full cover-zoom" /></span>;
}

export type Topic = 'all' | 'classroom' | 'themes' | 'howto' | 'homeschool';
// "Blog / Classroom ideas" over a post (the /brand Blog post mockup): plain
// links back, not a full trail.
export function BlogCrumb({ topic }: { topic: Topic }) {
  return (
    <nav aria-label={t('ways.crumb')} className="text-base font-bold text-muted">
      <Link to="/blog" className="text-muted no-underline hover:underline">{t('ways.title')}</Link>
      <span aria-hidden="true"> / </span>
      <Link to={`/blog?tag=${topic}`} className="text-muted no-underline hover:underline">{t(`ways.topic.${topic}` as StringKey)}</Link>
    </nav>
  );
}
