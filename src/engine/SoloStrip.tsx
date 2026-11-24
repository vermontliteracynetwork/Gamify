import type { CSSProperties, ReactNode } from 'react';
import { motion } from 'motion/react';
import { t } from '../i18n';
import { useSettings } from '../settings/SettingsContext';
import Meter from '../ui/Meter';

// THE solo board-game layout (teacher, 2026-11-24, Match Three first, then
// Bubble Pop and every future solo board game: "put meter on top, adding in
// the moves following my designs. xp as a number on the top of the right
// followed by power ups that are center aligned to the xp text"). The meter
// pill with the moves left runs across the top of the board; the score is a
// big number at the top right with the held power-ups under it, centered on
// the number. Wide screens put the score column beside the board; tall ones
// put it between the meter and the board, at the right. Nothing scrolls: the
// board takes what is left of the screen (`--solo-board`, set here).

// The paper pill: "N moves left", the meter (one segment per move when they
// fit, else one per round with this round part-filled), and the game's goal.
export function SoloMeter({ text, round, rounds, perRound, left, label, meterLabel, goal }: {
  text: string; round: number; rounds: number; perRound: number; left: number; label: string; meterLabel: string; goal?: ReactNode;
}) {
  const done = (Math.min(round, rounds) - 1) * perRound + (perRound - left);
  return (
    <div className="solo-meter inline-flex items-center gap-3 px-5 h-[3.75rem] max-w-full min-w-0 rounded-full bg-[var(--paper)] border-[3px] border-border" style={{ boxShadow: '0 3px 0 var(--color-border)' }} role="group" aria-label={label}>
      <b className="whitespace-nowrap text-lg leading-none" aria-live="polite">{text}</b>
      <span className="solo-meter-track min-w-[6rem] flex">
        {rounds * perRound <= 20
          ? <Meter segments={rounds * perRound} done={done} part={0.5} label={meterLabel} />
          : <Meter segments={rounds} done={Math.min(round, rounds) - 1} part={(perRound - left) / perRound || 0.12} label={meterLabel} />}
      </span>
      {goal}
    </div>
  );
}

// The score (XP) as a big number in the Gamify font, no box; the held
// power-ups sit under it, centered on it, always the top layer.
export function SoloScore({ score, children }: { score: number; children?: ReactNode }) {
  const still = useSettings().settings.motion === 'still';
  return (
    <div className="solo-score relative z-[25] grid justify-items-center content-start gap-3">
      {/* A steady live region, so screen readers hear each new score; only the inner number pops. */}
      <span className="text-[4.5rem] leading-[0.9] tabular-nums" role="status" aria-label={t('share.points', { count: score })} style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSynthesis: 'none', color: 'var(--stage-bg-text, #1d1a33)' }}>
        <motion.span key={score} className="inline-block" initial={still ? false : { scale: 1.3, rotate: -4 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 420, damping: 14 }}>{score}</motion.span>
      </span>
      {children}
    </div>
  );
}

// The stage: tools in the top right corner, the meter over the board, the
// score column at the right. `ground` is the stage's own background layer.
export default function SoloLayout({ tools, meter, score, board, ground, style }: {
  tools: ReactNode; meter: ReactNode; score: ReactNode; board: ReactNode; ground?: ReactNode; style?: CSSProperties;
}) {
  return (
    <div className="solo-layout relative play-fill overflow-hidden" style={style}>
      {ground}
      <div className="absolute top-3 right-3 flex items-center gap-2 z-30">{tools}</div>
      <div className="solo-grid relative h-full">
        <div className="solo-meter-cell grid place-items-center min-w-0">{meter}</div>
        <div className="solo-score-cell min-w-0">{score}</div>
        <div className="solo-board-cell grid place-items-center min-w-0 min-h-0">{board}</div>
      </div>
    </div>
  );
}
