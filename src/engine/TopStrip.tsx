import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { t } from '../i18n';
import { useSettings } from '../settings/SettingsContext';
import { TeamBadge } from './TeamBadge';

// The one strip across the top of a solo game's board (design system,
// 2026-11-18; teacher, 2026-11-16 and 11-18): the player's picture and the
// score in the Gamify font with no box behind it, then a dash for every turn
// of every round, grouped by round (used turns filled, this turn glowing),
// then anything the game adds on the right (Match Three's stars).
export default function TopStrip({ score, player, round, rounds, perRound, left, label, leftLabel, right, thisRound }: {
  score: number; player?: string; round: number; rounds: number; perRound: number; left: number; label: string; leftLabel: string; right?: ReactNode;
  // Turns in the current round when a power-up adds some (Bubble Pop's extra shots): every shot taken fills a dash.
  thisRound?: number;
}) {
  const still = useSettings().settings.motion === 'still';
  const cur = Math.min(round, rounds) - 1;
  const now = Math.max(perRound, thisRound ?? perRound);
  const usedNow = Math.max(0, now - left);
  return (
    <div className="w-full flex items-center gap-3 min-w-0" role="group" aria-label={label}>
      {player ? <img src={player} alt="" aria-hidden="true" className="w-9 h-9 rounded-full border-std border-border bg-surface object-contain shrink-0" /> : <TeamBadge colorIndex={0} size={36} />}
      {/* A steady live region, so screen readers hear each new score; only the inner number pops. */}
      <span className="font-display font-bold text-4xl leading-none tabular-nums min-w-[3ch]" role="status" aria-label={t('share.points', { count: score })}>
        <motion.span key={score} className="inline-block" initial={still ? false : { scale: 1.25 }} animate={{ scale: 1 }}>{score}</motion.span>
      </span>
      {/* One long bar like a ruler (teacher, 2026-11-20): a small tick for every
          turn, a big tick between rounds, green up to the turns used and a
          yellow marker on this turn. */}
      {(() => {
        const sizes = Array.from({ length: rounds }, (_, r) => (r === cur ? now : perRound));
        const total = sizes.reduce((a, b) => a + b, 0) || 1;
        const done = sizes.slice(0, cur).reduce((a, b) => a + b, 0) + usedNow;
        const ticks: { at: number; big: boolean }[] = [];
        let k = 0;
        sizes.forEach((n, r) => { for (let m = 1; m <= n; m++) { k++; if (k < total) ticks.push({ at: k / total, big: m === n }); } void r; });
        return (
          <span className="relative flex-1 min-w-0 h-6 rounded-pill border-std border-border bg-surface overflow-hidden" role="img" aria-label={leftLabel}>
            <motion.span aria-hidden="true" className="absolute inset-y-0 left-0 bg-success" initial={false} animate={{ width: `${(done / total) * 100}%` }} transition={{ duration: still ? 0 : 0.4 }} />
            {done < total && <span aria-hidden="true" className="absolute inset-y-0 bg-accent shadow-[0_0_0_2px_#000_inset]" style={{ left: `${(done / total) * 100}%`, width: `${100 / total}%` }} />}
            {ticks.map((tk, i) => (
              <span key={i} aria-hidden="true" className={`absolute bottom-0 -translate-x-1/2 ${tk.big ? 'top-0 w-[2.5px] bg-border' : 'h-[45%] w-[1.5px] bg-muted'}`} style={{ left: `${tk.at * 100}%` }} />
            ))}
          </span>
        );
      })()}
      {right}
    </div>
  );
}
