import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { t } from '../i18n';
import { useSettings } from '../settings/SettingsContext';
import Meter from '../ui/Meter';

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
      {/* THE meter (Brand Kit game components, 2026-11-24): one segment per turn
          when they fit, else one per round with the current round part-filled. */}
      <span className="flex-1 min-w-0 flex">
        {rounds * perRound <= 20
          ? <Meter segments={rounds * perRound} done={done} part={0.5} label={leftLabel} />
          : <Meter segments={rounds} done={Math.min(round, rounds) - 1} part={(perRound - left) / perRound || 0.12} label={leftLabel} />}
      </span>
      {right}
    </div>
  );
}
