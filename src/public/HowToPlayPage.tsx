import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, CheckCircle, Lightbulb, ListNumbers, PaintBrush, SlidersHorizontal, Sparkle } from '@phosphor-icons/react';
import { GameCover } from '../games/covers';
import { ModeBadge } from '../games/ModeBadge';
import { GAMES } from '../games/registry';
import type { GameManifest } from '../games/types';
import { t } from '../i18n';
import { buttonClasses } from '../ui/kit';
import Title from '../ui/Title';
import { HOW_TO_PLAY, SHARED_RULES, SHOTS } from './howToPlay';
import PublicFooter from './PublicFooter';

// How to Play articles in the Blog (teacher, 2026-10-31): every listed game,
// with screenshots of the real game and every feature, piece and rule.
export const howToGames = (): GameManifest[] => GAMES.filter((g) => HOW_TO_PLAY.some((h) => h.gameId === g.id));

export function HowToPlayCard({ game }: { game: GameManifest }) {
  return (
    <Link to={`/blog/how-to-play/${game.id}`} className="hover-lift rounded-panel bg-surface border-[2.5px] border-border no-underline text-text overflow-hidden flex flex-col" style={{ boxShadow: 'var(--shadow-sticker)' }}>
      <span className="block overflow-hidden border-b-[2.5px] border-border"><GameCover gameId={game.id} className="aspect-[16/9] cover-zoom" /></span>
      <span className="p-4 grid gap-2">
        <span className="font-display text-2xl leading-tight">{t('howto.cardTitle', { game: game.name })}</span>
        <span className="font-semibold text-sm">{game.description}</span>
        <span className="inline-flex items-center gap-1 text-xs font-bold text-muted"><BookOpen weight="bold" size={16} aria-hidden="true" />{t('howto.tag')}</span>
      </span>
    </Link>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="bg-surface border-[2.5px] border-border rounded-panel p-5 grid gap-3" style={{ boxShadow: 'var(--shadow-sticker)' }}>
      <h2 className="font-display text-2xl flex items-center gap-2">{icon}<Title text={title} /></h2>
      {children}
    </section>
  );
}

export default function HowToPlayPage() {
  const { gameId } = useParams();
  const game = howToGames().find((g) => g.id === gameId);
  const h = HOW_TO_PLAY.find((x) => x.gameId === gameId);
  if (!game || !h) return <main className="max-w-3xl mx-auto p-6"><Link to="/blog?tag=howto" className={buttonClasses('secondary')}>{t('howto.all')}</Link></main>;
  const list = 'grid gap-2 pl-5 m-0 font-semibold text-lg';
  return (
    <>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 grid gap-5">
        <Link to="/blog?tag=howto" className={buttonClasses('secondary', 'justify-self-start')}><ArrowLeft weight="bold" size={18} />{t('howto.all')}</Link>
        <GameCover gameId={game.id} className="aspect-[21/9] rounded-panel border-[2.5px] border-border" />
        <h1 className="title-bubble text-4xl sm:text-5xl"><Title text={t('howto.cardTitle', { game: game.name })} /></h1>
        <div className="flex flex-wrap gap-2">{game.modes.map((m) => <ModeBadge key={m} mode={m} withHint />)}</div>
        <p className="text-xl font-bold">{h.goal}</p>

        <div className="grid sm:grid-cols-2 gap-3">
          {SHOTS.map((s) => (
            <figure key={s} className="m-0 grid gap-1">
              <img src={`/help/${game.id}-${s}.png`} onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.display = 'none'; }} alt={t(`howto.shot.${s}`, { game: game.name })} loading="lazy"
                className="w-full aspect-[16/10] object-cover object-top rounded-input border-[2.5px] border-border bg-surface" />
              <figcaption className="text-sm font-bold">{t(`howto.shot.${s}`, { game: game.name })}</figcaption>
            </figure>
          ))}
        </div>

        <Section icon={<ListNumbers weight="bold" size={26} aria-hidden="true" />} title={t('howto.turn')}>
          <ol className={`${list} list-decimal marker:font-bold`}>{h.steps.map((x) => <li key={x}>{x}</li>)}</ol>
        </Section>
        <Section icon={<Sparkle weight="bold" size={26} aria-hidden="true" />} title={t('howto.pieces')}>
          <dl className="grid gap-3 m-0">{h.pieces.map((p) => <div key={p.name}><dt className="font-display text-xl">{p.name}</dt><dd className="m-0 font-semibold text-lg">{p.what}</dd></div>)}</dl>
        </Section>
        <Section icon={<CheckCircle weight="bold" size={26} aria-hidden="true" />} title={t('howto.rules')}>
          <ul className={`${list} list-disc`}>{[...h.rules, ...SHARED_RULES].map((x) => <li key={x}>{x}</li>)}</ul>
        </Section>
        <Section icon={<SlidersHorizontal weight="bold" size={26} aria-hidden="true" />} title={t('howto.settings')}>
          <ul className={`${list} list-disc`}>{h.settings.map((x) => <li key={x}>{x}</li>)}</ul>
        </Section>
        <Section icon={<Lightbulb weight="bold" size={26} aria-hidden="true" />} title={t('howto.tips')}>
          <ul className={`${list} list-disc`}>{h.tips.map((x) => <li key={x}>{x}</li>)}</ul>
        </Section>
        <div className="flex flex-wrap gap-2">
          <Link to={`/blog/themes/${game.id}`} className={buttonClasses('secondary', 'hover-pop')}><PaintBrush weight="bold" size={18} />{t('howto.themeGuide')}</Link>
          <Link to="/login?mode=signup" className={buttonClasses('primary', 'hover-pop')}>{t('ways.start')}</Link>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
