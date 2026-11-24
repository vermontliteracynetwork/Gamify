import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { t } from '../i18n';
import { useSettings } from '../settings/SettingsContext';

// The one strip across the top of a solo game's board (design system,
// 2026-11-18; teacher, 2026-11-16 and 11-18): the player's picture and the
// score in the Gamify font with no box behind it, then a dash for every turn
// of every round, grouped by round (used turns filled, this turn glowing),
// then anything the game adds on the right (Match Three's stars).
export default function TopStrip({ score, player, round, rounds, perRound, left, label, leftLabel, right }: {
  score: number; player?: string; round: number; rounds: number; perRound: number; left: number; label: string; leftLabel: string; right?: ReactNode;
}) {
  const still = useSettings().settings.motion === 'still';
  const done = (Math.min(round, rounds) - 1) * perRound + (perRound - left);
  return (
    <div className="w-full flex items-center justify-center gap-2 min-w-0" role="group" aria-label={label}>
      {/* Solo games show no player icon (teacher, 2026-11-23); kept only when a theme designed one. */}
      {player && <img src={player} alt="" aria-hidden="true" className="w-9 h-9 rounded-full border-std border-border bg-surface object-contain shrink-0" />}
      {/* A steady live region, so screen readers hear each new score; only the inner number pops. */}
      <span className="font-display font-bold text-4xl leading-none tabular-nums min-w-[3ch]" role="status" aria-label={t('share.points', { count: score })}>
        <motion.span key={score} className="inline-block" initial={still ? false : { scale: 1.25 }} animate={{ scale: 1 }}>{score}</motion.span>
      </span>
      <span className="flex-1 min-w-0 flex gap-2" role="img" aria-label={leftLabel}>
        {Array.from({ length: rounds }, (_, r) => (
          <span key={r} aria-hidden="true" className="flex-1 flex gap-[3px] p-[3px] rounded-pill border-std border-border bg-surface">
            {Array.from({ length: perRound }, (_, m) => {
              const k = r * perRound + m;
              // Used turns are filled green, this turn yellow with a ring, turns to come are hollow (shape, not only color).
              return <span key={m} className={`flex-1 h-2.5 rounded-pill ${k < done ? 'bg-success' : k === done ? 'bg-accent shadow-[0_0_0_2px_#000]' : 'border-thin border-muted bg-transparent'}`} />;
            })}
          </span>
        ))}
      </span>
      {right}
    </div>
  );
}
