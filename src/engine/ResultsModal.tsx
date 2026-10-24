import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { ArrowCounterClockwise, Trophy } from '@phosphor-icons/react';
import type { MultipleChoiceQuestion } from '../data/types';
import { useSettings } from '../settings/SettingsContext';
import LookBack from './LookBack';

// End-of-game results in a box over the game, so the screen never scrolls:
// the headline, a few facts, Play again, and Let's look back.
export default function ResultsModal({ title, children, missed, againLabel, onAgain }: {
  title: string; children?: ReactNode; missed: MultipleChoiceQuestion[]; againLabel: string; onAgain: () => void;
}) {
  const { settings } = useSettings();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35" role="dialog" aria-modal="true" aria-label={title}>
      <motion.div initial={settings.motion === 'still' ? false : { scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg bg-surface border-[2.5px] border-border rounded-panel p-5 grid gap-4" style={{ boxShadow: 'var(--shadow-sticker-lg)', maxHeight: 'calc(100dvh - 32px)' }}>
        <div className="grid justify-items-center gap-1 text-center">
          <Trophy weight="fill" size={52} className="text-accent" aria-hidden="true" />
          <h2 className="font-display text-3xl font-bold text-balance">{title}</h2>
          {children}
        </div>
        <button type="button" onClick={onAgain}
          className="justify-self-center min-h-14 px-8 rounded-pill border-[2.5px] border-border bg-accent font-display text-xl font-bold inline-flex items-center gap-2">
          <ArrowCounterClockwise weight="bold" size={22} />{againLabel}
        </button>
        <LookBack missed={missed} />
      </motion.div>
    </div>
  );
}
