import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Sparkle } from '@phosphor-icons/react';
import { GameCover } from '../games/covers';
import { ModeBadge } from '../games/ModeBadge';
import { GAMES } from '../games/registry';
import { data } from '../data';
import { useAsync } from '../data/hooks';
import { useSession } from './session';
import { t } from '../i18n';

const EASE = [0.16, 1, 0.3, 1] as const;

export default function Home() {
  const reduce = useReducedMotion();
  const { value: classes = [] } = useAsync(() => data.listClassrooms());
  const session = useSession();

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-16">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="mb-10"
      >
        <h1 className="title-bubble text-4xl sm:text-5xl tracking-tight mb-2">{t('home.title')}</h1>
        <p className="text-text font-bold text-base max-w-[50ch]">{t('home.subtitle')}</p>
      </motion.div>

      {(classes.length > 0 || session) && (
        <div className="flex flex-wrap gap-2 mb-6">
          {session
            ? <Link to="/arcade" className="min-h-12 px-5 rounded-pill border-[2.5px] border-border bg-accent font-display text-lg font-bold no-underline text-text inline-flex items-center" style={{ boxShadow: 'var(--shadow-sticker)' }}>{t('home.myArcade', { name: session.name })}</Link>
            : classes.map((c) => (
              <Link key={c.id} to={`/arcade/${c.id}`} className="min-h-12 px-5 rounded-pill border-[2.5px] border-border bg-accent font-display text-lg font-bold no-underline text-text inline-flex items-center" style={{ boxShadow: 'var(--shadow-sticker)' }}>{t('home.signIn', { name: c.name })}</Link>
            ))}
        </div>
      )}

      {GAMES.length === 0 && (
        <div
          className="flex flex-col items-center gap-3 p-8 rounded-panel bg-surface border-[2.5px] border-border text-center"
          style={{ boxShadow: 'var(--shadow-sticker-lg)' }}
        >
          <Sparkle weight="fill" size={40} className="text-accent" />
          <h2 className="font-display text-xl font-bold text-text">{t('home.comingSoon')}</h2>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {GAMES.map((game, i) => (
          <motion.div
            key={game.id}
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: reduce ? 0 : i * 0.08, ease: EASE }}
          >
            <Link
              to={`/games/${game.id}`}
              className="group relative flex flex-col rounded-panel bg-surface border-[2.5px] border-border no-underline overflow-hidden h-full
                         hover:bg-surface-hover active:scale-[0.98] motion-safe:transition-transform"
              style={{ boxShadow: 'var(--shadow-sticker-lg)' }}
            >
              <GameCover gameId={game.id} className="aspect-[16/9] border-b-[2.5px] border-border motion-safe:group-hover:scale-[1.02] motion-safe:transition-transform" />
              <div className="p-5 flex flex-col gap-3 flex-1">
                <h2 className="font-display text-2xl font-bold text-text">{game.name}</h2>
                <div className="flex flex-wrap gap-2">{game.modes.map((m) => <ModeBadge key={m} mode={m} />)}</div>
                <p className="text-muted text-sm leading-relaxed">{game.description}</p>
                <div className="mt-auto flex items-center gap-1.5 text-sm font-bold text-accent-ink">
                  {t('home.play')}
                  <ArrowRight weight="bold" size={16} className="transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </main>
  );
}
