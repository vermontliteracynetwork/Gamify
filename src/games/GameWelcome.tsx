import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { Play } from '@phosphor-icons/react';
import { t } from '../i18n';
import { useSettings } from '../settings/SettingsContext';
import { GameCover } from './covers';
import { ModeBadge } from './ModeBadge';
import type { GameManifest } from './types';
import Title from '../ui/Title';

export interface HowStep { icon: ReactNode; text: string }

// The cover welcome screen every game opens on: the cover picture, the
// game's name, how it's played (mode), three picture steps, and one big
// button into the setup pages.
// `cover` is no longer shown (kept so callers need no change).
export default function GameWelcome({ game, steps, onStart }: { game: GameManifest; steps: HowStep[]; cover?: string; onStart: () => void }) {
  const { settings } = useSettings();
  return (
    // Fills the whole stage (teacher, 2026-11-06), and the cover is always
    // shown whole at its own shape, never cropped.
    <motion.section initial={settings.motion === 'still' ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="menu-panel overflow-hidden w-full max-w-7xl mx-auto grid lg:grid-rows-[auto_minmax(0,1fr)] max-lg:content-start max-lg:gap-y-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] gap-x-10 gap-y-4 px-2 sm:px-4"
      style={{ height: 'calc(100dvh - 7.5rem)' }}>
      {/* One standard start screen for every game (teacher, 2026-10-31): the
          Gamify cover, never a theme's, so menus need no custom design. */}
      {/* The title sits level with the corner buttons (teacher, 2026-11-06). */}
      <h1 className="lg:col-span-2 title-bubble text-4xl sm:text-5xl pr-48 min-h-14 flex items-center" style={{ color: 'var(--text)' }}><Title text={game.name} /></h1>
      <div className="flex items-center justify-center min-h-0 max-lg:max-h-[38vh]">
        <GameCover gameId={game.id} className="w-full max-h-full max-lg:w-auto max-lg:h-full aspect-[100/62] rounded-panel border-[2.5px] border-border" />
      </div>
      <div className="pb-4 grid gap-5 content-center min-h-0">
        <div className="grid gap-2">{game.modes.map((m) => <ModeBadge key={m} mode={m} withHint />)}</div>
        <ol className="grid gap-2 list-none p-0 m-0" aria-label={t('welcome.how')}>
          {steps.map((s, i) => (
            <li key={i} className="flex items-center gap-3 text-lg leading-snug">
              <span className="w-12 h-12 shrink-0 rounded-full border-[2.5px] border-border bg-accent flex items-center justify-center" aria-hidden="true">{s.icon}</span>
              <span className="font-bold">{s.text}</span>
            </li>
          ))}
        </ol>
        <button type="button" onClick={onStart}
          className="min-h-16 px-8 rounded-pill border-[2.5px] border-border bg-accent font-display text-2xl font-bold inline-flex items-center justify-center gap-2 active:scale-95"
          style={{ boxShadow: 'var(--shadow-sticker)' }}>
          <Play weight="fill" size={26} />{t('welcome.start')}
        </button>
      </div>
    </motion.section>
  );
}
