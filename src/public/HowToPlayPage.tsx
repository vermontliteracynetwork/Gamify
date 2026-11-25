import { Link, useParams } from 'react-router-dom';
import { ArrowRight, BookOpen, PaintBrush } from '@phosphor-icons/react';
import { GameCover } from '../games/covers';
import { ModeBadge, shownModes } from '../games/ModeBadge';
import { GAMES } from '../games/registry';
import type { GameManifest } from '../games/types';
import { t } from '../i18n';
import { buttonClasses } from '../ui/kit';
import Title from '../ui/Title';
import { HOW_TO_PLAY, SHARED_RULES, SHOTS } from './howToPlay';
import PublicFooter from './PublicFooter';
import { BlogCard, BlogCrumb, GameHeader, Steps } from './BlogCard';

// How to Play articles in the Blog (teacher, 2026-10-31): every listed game,
// with screenshots of the real game and every feature, piece and rule.
export const howToGames = (): GameManifest[] => GAMES.filter((g) => HOW_TO_PLAY.some((h) => h.gameId === g.id));

export function HowToPlayCard({ game }: { game: GameManifest }) {
  return <BlogCard to={`/blog/how-to-play/${game.id}`} header={<GameHeader gameId={game.id} />} title={t('howto.cardTitle', { game: game.name })} sub={game.description}
    meta={<span className="inline-flex items-center gap-1 text-xs font-bold text-muted"><BookOpen weight="bold" size={16} aria-hidden="true" />{t('howto.tag')}</span>} />;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-3">
      <h2 className="font-heading font-bold text-2xl sm:text-3xl">{title}</h2>
      {children}
    </section>
  );
}

export default function HowToPlayPage() {
  const { gameId } = useParams();
  const game = howToGames().find((g) => g.id === gameId);
  const h = HOW_TO_PLAY.find((x) => x.gameId === gameId);
  if (!game || !h) return <main className="max-w-6xl mx-auto px-4 sm:px-6 p-6"><Link to="/blog?tag=howto" className={buttonClasses('secondary')}>{t('howto.all')}</Link></main>;
  const list = 'grid gap-2 pl-6 m-0 font-semibold text-lg leading-relaxed';
  return (
    <>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">
        <article className="max-w-[47.5rem] mx-auto grid gap-6">
          <div className="grid gap-4">
            <BlogCrumb topic="howto" />
            <h1 className="title-bubble"><Title text={t('howto.cardTitle', { game: game.name })} /></h1>
            <p className="text-xl font-semibold leading-snug">{h.goal}</p>
            <div className="flex flex-wrap gap-2">{shownModes(game.modes).map((m) => <ModeBadge key={m} mode={m} withHint />)}</div>
          </div>
          <GameCover gameId={game.id} className="aspect-[16/9] w-full rounded-panel border-bold border-border" />

          <div className="grid sm:grid-cols-2 gap-4">
            {SHOTS.map((s) => (
              <figure key={s} className="m-0 grid gap-1.5 content-start">
                <img src={`/help/${game.id}-${s}.png`} onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.display = 'none'; }} alt={t(`howto.shot.${s}`, { game: game.name })} loading="lazy"
                  className="w-full aspect-[16/10] object-cover object-top rounded-input border-bold border-border bg-surface" />
                <figcaption className="text-sm font-bold">{t(`howto.shot.${s}`, { game: game.name })}</figcaption>
              </figure>
            ))}
          </div>

          <Section title={t('howto.turn')}><Steps items={h.steps} /></Section>
          <Section title={t('howto.pieces')}>
            <dl className="grid gap-3 m-0">{h.pieces.map((p) => <div key={p.name} className="bg-surface border-std border-border rounded-input p-4"><dt className="font-heading font-bold text-lg">{p.name}</dt><dd className="m-0 font-semibold">{p.what}</dd></div>)}</dl>
          </Section>
          <Section title={t('howto.rules')}><ul className={`${list} list-disc`}>{[...h.rules, ...SHARED_RULES].map((x) => <li key={x}>{x}</li>)}</ul></Section>
          <Section title={t('howto.settings')}><ul className={`${list} list-disc`}>{h.settings.map((x) => <li key={x}>{x}</li>)}</ul></Section>
          <section className="bg-mint border-bold border-border rounded-panel p-5 sm:p-6 grid gap-3" style={{ boxShadow: 'var(--shadow-sticker)' }}>
            <h2 className="font-heading font-bold text-2xl">{t('howto.tips')}</h2>
            <ul className={`${list} list-disc`}>{h.tips.map((x) => <li key={x}>{x}</li>)}</ul>
          </section>
          <div className="flex flex-wrap gap-3">
            <Link to="/login?mode=signup" className={buttonClasses('primary', 'hover-pop', 'lg')}>{t('ways.start')}<ArrowRight weight="bold" size={20} /></Link>
            <Link to={`/blog/themes/${game.id}`} className={buttonClasses('secondary', 'hover-pop', 'lg')}><PaintBrush weight="bold" size={18} />{t('howto.themeGuide')}</Link>
          </div>
        </article>
      </main>
      <PublicFooter />
    </>
  );
}
