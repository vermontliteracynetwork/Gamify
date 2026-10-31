import { AnimatePresence, motion } from 'motion/react';
import { t } from '../i18n';
import { useSettings } from '../settings/SettingsContext';

// The score panel beside every solo game, the same in each (teacher,
// 2026-10-31: one cohesive look across games). Big score, a round line, dots
// for moves or shots left, an optional "what to do" line, and a short note.
// Small screens: one compact row; large screens: a column beside the board.
export default function SoloPanel({ score, line, dots, status, note, className = '' }: {
  score: number;
  line: string;
  dots?: { left: number; total: number; label: string };
  status?: string;
  note?: string;
  className?: string;
}) {
  const { settings } = useSettings();
  const still = settings.motion === 'still';
  return (
    <aside className={`grid gap-2 lg:gap-3 content-start min-w-0 ${className}`} aria-label={t('bm.score')}>
      <div className="bg-surface border-[2.5px] border-border rounded-panel px-4 py-2 lg:p-4 flex lg:grid items-center gap-x-5 gap-y-2 flex-wrap" style={{ boxShadow: 'var(--shadow-sticker)' }}>
        <p className="hidden lg:block text-xs font-bold uppercase tracking-wider text-muted">{t('bm.score')}</p>
        <motion.p key={score} initial={still ? false : { scale: 1.3 }} animate={{ scale: 1 }} className="font-display text-3xl lg:text-4xl tabular-nums">{score}</motion.p>
        <p className="font-bold">{line}</p>
        {dots && (
          <div className="flex gap-1.5 flex-wrap" role="img" aria-label={dots.label}>
            {Array.from({ length: Math.max(dots.total, dots.left) }, (_, i) => (
              <span key={i} className={`w-5 h-5 lg:w-6 lg:h-6 rounded-full border-[2px] border-border ${i < dots.left ? 'bg-accent' : 'bg-surface-2'}`} />
            ))}
          </div>
        )}
        {status && <p className="font-display text-lg lg:text-xl w-full lg:w-auto" aria-live="polite">{status}</p>}
      </div>
      <AnimatePresence>
        {note && (
          <motion.p key={note} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="font-bold bg-surface rounded-input border-[2px] border-border p-3" role="status">{note}</motion.p>
        )}
      </AnimatePresence>
    </aside>
  );
}
