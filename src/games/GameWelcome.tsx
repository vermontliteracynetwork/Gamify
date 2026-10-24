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
export default function GameWelcome({ game, steps, cover, onStart }: { game: GameManifest; steps: HowStep[]; cover?: string; onStart: () => void }) {
  const { settings } = useSettings();
  return (
    <div className="grid content-center" style={{ minHeight: 'calc(100dvh - 190px)' }}>
    <motion.section initial={settings.motion === 'still' ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="bg-surface border-[2.5px] border-border rounded-panel overflow-hidden max-w-3xl mx-auto grid md:grid-cols-[1.1fr_1fr]" style={{ boxShadow: 'var(--shadow-sticker-lg)' }}>
      {cover
        ? <img src={cover} alt="" className="w-full h-full min-h-48 object-cover aspect-[16/10] md:aspect-auto" />
        : <GameCover gameId={game.id} className="min-h-48 md:min-h-full aspect-[16/10] md:aspect-auto" />}
      <div className="p-5 sm:p-6 grid gap-4 content-start">
        <h1 className="title-bubble text-4xl sm:text-5xl"><Title text={game.name} /></h1>
        <div className="flex flex-wrap gap-2">{game.modes.map((m) => <ModeBadge key={m} mode={m} withHint />)}</div>
        <ol className="grid gap-2 list-none p-0 m-0" aria-label={t('welcome.how')}>
          {steps.map((s, i) => (
            <li key={i} className="flex items-center gap-3">
              <span className="w-11 h-11 shrink-0 rounded-full border-[2.5px] border-border bg-accent flex items-center justify-center" aria-hidden="true">{s.icon}</span>
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
    </div>
  );
}
