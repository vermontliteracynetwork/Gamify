import { useState } from 'react';
import type { PlayMode } from '../data/types';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useReducedMotion } from '../ui/useReducedMotion';
import { LockSimple, Sparkle } from '@phosphor-icons/react';
import { canPlayGame } from '../config';

import { GameCover } from '../games/covers';
import { MODE_COLORS, MODE_ICONS, ModeDot, SHOWN_MODES, shownModes } from '../games/ModeBadge';
import { GAMES } from '../games/registry';
import { useTier } from '../data/hooks';
import { useTeacher } from '../auth/session';
import { useSession } from './session';
import { t } from '../i18n';
import Title from '../ui/Title';

const EASE = [0.16, 1, 0.3, 1] as const;

export default function Home() {
  const reduce = useReducedMotion();
  // Signed in means a teacher, unless a student came in through Join
  // (teacher, 2026-10-26): no class sign-in buttons here.
  const session = useSession();
  const teacher = useTeacher();
  const tier = useTier();
  const [mode, setMode] = useState<PlayMode | null>(null);
  // Students never browse games; their code opens the one game (teacher, 2026-10-31).
  if (session && !teacher) return <Navigate to="/join" replace />;

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-16">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="mb-6 flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <h1 className="title-bubble text-4xl sm:text-5xl tracking-tight"><Title text={t('home.title')} /></h1>
          {!(teacher && !session) && <p className="text-text font-bold text-base max-w-[50ch] mt-2">{t('home.subtitle')}</p>}
        </div>
        {/* The three way circles filter the games, no intro line (approved
            /brand Pick a game, her rule 2026-11-06; batch 6, 2026-11-24). */}
        {teacher && !session && (
          <div role="group" aria-label={t('ways.label')} className="flex gap-2">
            {SHOWN_MODES.map((m) => {
              const Ic = MODE_ICONS[m]; const on = mode === m;
              return (
                <button key={m} type="button" aria-pressed={on} aria-label={t('ways.filterTip', { mode: t(`mode.${m}`) })} data-tip={t(`mode.${m}`)} data-tip-bg={MODE_COLORS[m]}
                  onClick={() => setMode(on ? null : m)}
                  className={`hover-pop w-12 h-12 rounded-full border-std border-border grid place-items-center ${on ? 'ring-4 ring-offset-2 ring-border ring-offset-surface' : mode ? 'opacity-50' : ''}`} style={{ background: MODE_COLORS[m] }}>
                  <Ic weight="bold" size={22} aria-hidden="true" />
                </button>
              );
            })}
          </div>
        )}
      </motion.div>


      {GAMES.length === 0 && (
        <div
          className="flex flex-col items-center gap-3 p-8 rounded-panel bg-surface border-bold border-border text-center"
          style={{ boxShadow: 'var(--shadow-sticker-lg)' }}
        >
          <Sparkle weight="fill" size={40} className="text-accent" />
          <h2 className="font-display text-xl font-bold text-text"><Title text={t('home.comingSoon')} /></h2>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {GAMES.filter((g) => !mode || shownModes(g.modes).includes(mode)).map((game, i) => (
          <motion.div
            key={game.id}
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: reduce ? 0 : i * 0.08, ease: EASE }}
          >
            <Link
              to={`/games/${game.id}`}
              className="group relative flex flex-col rounded-panel bg-surface border-bold border-border no-underline overflow-hidden h-full
                         hover:bg-surface-hover active:scale-[0.98] motion-safe:transition-transform"
              style={{ boxShadow: 'var(--shadow-sticker-lg)' }}
            >
              <span className="relative block">
                <GameCover gameId={game.id} className={`aspect-[4/3] border-b-[2.5px] border-border motion-safe:group-hover:scale-[1.02] motion-safe:transition-transform ${canPlayGame(tier, game.id) ? '' : 'grayscale opacity-60'}`} />
                {!canPlayGame(tier, game.id) && <span className="absolute inset-0 flex items-center justify-center"><span className="w-14 h-14 rounded-full bg-surface border-heavy border-border flex items-center justify-center"><LockSimple weight="fill" size={28} aria-label={t('arcade.locked', { name: game.name })} /></span></span>}
              </span>
              <div className="px-3.5 py-3 flex items-center gap-2 flex-1">
                <h2 className="title-bubble flex-1 min-w-0 text-xl sm:text-2xl leading-none text-text"><Title text={game.name} /></h2>
                {/* Just the icon in its color, small, in one row (teacher, 2026-11-16). */}
                <div className="flex gap-1.5 shrink-0">{shownModes(game.modes).map((m) => <ModeDot key={m} mode={m} small />)}</div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </main>
  );
}
