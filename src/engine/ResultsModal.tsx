import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowCounterClockwise, HouseSimple, Trophy } from '@phosphor-icons/react';
import { useSignedIn } from '../auth/session';
import { t } from '../i18n';
import type { MultipleChoiceQuestion } from '../data/types';
import { useSettings } from '../settings/SettingsContext';
import LookBack from './LookBack';
import Title from '../ui/Title';

// End-of-game results in a box over the game, so the screen never scrolls:
// the headline, a few facts, Play again (back to this game's start) or
// Back to the Arcade, and Let's look back.
export default function ResultsModal({ title, children, missed, againLabel, onAgain }: {
  title: string; children?: ReactNode; missed: MultipleChoiceQuestion[]; againLabel: string; onAgain: () => void;
}) {
  const { settings } = useSettings();
  const { student } = useSignedIn();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35" role="dialog" aria-modal="true" aria-label={title}>
      <motion.div initial={settings.motion === 'still' ? false : { scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg bg-surface border-[2.5px] border-border rounded-panel p-5 grid gap-4" style={{ boxShadow: 'var(--shadow-sticker-lg)', maxHeight: 'calc(100dvh - 32px)' }}>
        <div className="grid justify-items-center gap-1 text-center">
          <Trophy weight="fill" size={52} className="text-accent" aria-hidden="true" />
          <h2 className="font-display text-3xl font-bold text-balance"><Title text={title} /></h2>
          {children}
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <button type="button" onClick={onAgain}
            className="min-h-14 px-7 rounded-pill border-[2.5px] border-border bg-accent font-display text-xl font-bold inline-flex items-center gap-2">
            <ArrowCounterClockwise weight="bold" size={22} />{againLabel}
          </button>
          <Link to={student ? '/arcade' : '/play'}
            className="min-h-14 px-7 rounded-pill border-[2.5px] border-border bg-surface-2 font-display text-xl font-bold inline-flex items-center gap-2 no-underline text-text">
            <HouseSimple weight="bold" size={22} />{t('results.arcade')}
          </Link>
        </div>
        <LookBack missed={missed} />
      </motion.div>
    </div>
  );
}
