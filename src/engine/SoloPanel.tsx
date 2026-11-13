import { AnimatePresence, motion } from 'motion/react';
import { Star } from '@phosphor-icons/react';
import { t } from '../i18n';
import { RoundMeter } from './ScoreBoard';
import { useSettings } from '../settings/SettingsContext';

// The score panel beside every solo game, the same in each (teacher,
// 2026-10-31: one cohesive look across games). Big score, a round line, dots
// for moves or shots left, an optional "what to do" line, and a short note.
// Small screens: one compact row; large screens: a column beside the board.
export default function SoloPanel({ score, line, round, dots, status, note, className = '' }: {
  score: number;
  line: string;
  // "2/6" and its label: shown as the round box under the score.
  round?: { now: string; label: string };
  dots?: { left: number; total: number; label: string };
  status?: string;
  note?: string;
  className?: string;
}) {
  const { settings } = useSettings();
  const still = settings.motion === 'still';
  return (
    <aside className={`grid gap-2 lg:gap-3 content-start min-w-0 ${className}`} aria-label={t('bm.score')}>
      <div className="score-card overflow-hidden">
        <p className="score-head hidden lg:flex"><Star weight="fill" size={16} aria-hidden="true" />{t('bm.score')}</p>
        <div className="px-4 py-2 lg:p-4 flex lg:grid items-center gap-x-5 gap-y-2 flex-wrap">
        <motion.p key={score} initial={still ? false : { scale: 1.3 }} animate={{ scale: 1 }} className="font-display text-4xl lg:text-6xl tabular-nums leading-none">{score}</motion.p>
        <p className={`font-bold whitespace-nowrap ${round ? 'lg:hidden' : ''}`}>{line}</p>
        {dots && (
          <div className="flex gap-1.5 flex-wrap items-center" role="img" aria-label={dots.label}>
            <span className="hidden lg:block w-full text-xs font-bold uppercase tracking-wider text-muted">{t('solo.left')}</span>
            {Array.from({ length: Math.max(dots.total, dots.left) }, (_, i) => (
              <span key={i} className={`w-5 h-5 lg:w-6 lg:h-6 rounded-full border-[2px] border-border ${i < dots.left ? 'bg-accent' : 'bg-surface-2'}`} />
            ))}
          </div>
        )}
        {status && <p className="font-display text-lg lg:text-xl w-full lg:w-auto" aria-live="polite">{status}</p>}
        </div>
      </div>
      {round && <RoundMeter round={round.now} label={round.label} className="hidden lg:block" />}
      <AnimatePresence>
        {note && (
          <motion.p key={note} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="font-bold bg-surface rounded-input border-[2px] border-border p-3" role="status">{note}</motion.p>
        )}
      </AnimatePresence>
    </aside>
  );
}
