import { motion } from 'motion/react';
import { Crown, Trophy } from '@phosphor-icons/react';
import { t } from '../i18n';
import { useSettings } from '../settings/SettingsContext';
import { TeamBadge } from './TeamBadge';
import { leaders, type TurnState } from './turns';

// The round (or progress) box under every score board (teacher, 2026-11-13:
// "improve score boards universally"): a small label, the big "2/6" in the
// title font and a bar that fills as the game goes on.
export function RoundMeter({ round, label, className = '' }: { round: string; label?: string; className?: string }) {
  const { settings } = useSettings();
  const still = settings.motion === 'still';
  const [n, total] = round.split('/').map((x) => Number(x));
  const part = total > 0 && Number.isFinite(n) ? Math.min(1, n / total) : null;
  return (
    <div className={`score-card overflow-hidden text-center ${className}`}>
      {label && <p className="score-head justify-center">{label}</p>}
      <motion.p key={round} initial={still ? false : { scale: 1.3 }} animate={{ scale: 1 }} className={`font-display font-bold tabular-nums leading-none px-4 pt-2 ${round.length <= 7 ? 'text-5xl' : 'text-xl'}`}>{round}</motion.p>
      {part !== null && (
        <div className="mx-4 mt-2 mb-3 h-3 rounded-pill border-[2px] border-border bg-surface-2 overflow-hidden" aria-hidden="true">
          <motion.span className="block h-full rounded-pill" style={{ background: 'linear-gradient(90deg, #b4c4fb, #8fe3a0)' }} initial={false} animate={{ width: `${part * 100}%` }} transition={{ duration: still ? 0 : 0.5 }} />
        </div>
      )}
    </div>
  );
}

// The scores beside every team game, the same in each (teacher, 2026-10-31:
// whose turn it is glows here, with no "pick a..." bar over the board). On
// small screens it is one row that scrolls sideways, so it never pushes the
// board off the screen. `round` is a line such as "Drop 2 of 6".
export default function ScoreBoard({ turns, playing, round, roundLabel }: { turns: TurnState; playing: boolean; round?: string; roundLabel?: string }) {
  const { settings } = useSettings();
  const still = settings.motion === 'still';
  const now = playing ? turns.players[turns.turn] : null;
  const top = !playing ? leaders(turns) : [];
  const glow = '0 0 0 4px #fdfd94, 0 0 20px 6px #fdfd94';
  return (
    // On big screens the round or progress sits big and centered under the
    // scores, level with the bottom of the board (teacher, 2026-11-06).
    <div className="order-first lg:order-none min-w-0 lg:h-full lg:flex lg:flex-col lg:gap-3">
    <aside className="score-card grid min-w-0 overflow-hidden" aria-label={t('share.scores')}>
      <h2 className="score-head hidden lg:flex"><Trophy weight="fill" size={16} aria-hidden="true" />{t('share.scores')}</h2>
      <ol className="flex flex-nowrap overflow-x-auto lg:overflow-visible lg:grid lg:grid-cols-1 gap-1.5 lg:gap-2 list-none m-0 p-2 lg:p-3">
        {turns.players.map((p) => {
          const on = now?.id === p.id;
          return (
            <motion.li key={p.id} aria-current={on ? 'true' : undefined}
              animate={on && !still ? { boxShadow: ['0 0 0 3px #fdfd94, 0 0 14px 4px #fdfd94', '0 0 0 4px #fdfd94, 0 0 26px 10px #fdfd94', '0 0 0 3px #fdfd94, 0 0 14px 4px #fdfd94'] } : { boxShadow: on ? glow : '0 0 0 0 transparent' }}
              transition={on && !still ? { duration: 1.6, repeat: Infinity } : { duration: 0.2 }}
              className={`shrink-0 lg:shrink flex items-center gap-2.5 rounded-input border-[2px] p-1.5 lg:p-2 motion-safe:transition-transform motion-safe:hover:scale-[1.03] ${on ? 'border-border bg-accent' : 'border-border-soft bg-surface'}`}>
              {/* A player's picture is their game piece when they have one (teacher, 2026-11-06). */}
              {p.art ? <img src={p.art} alt="" aria-hidden="true" className="w-11 h-11 object-contain shrink-0" /> : <TeamBadge colorIndex={p.colorIndex} size={44} />}
              <span className="flex-1 min-w-0 grid">
                <span className="font-bold leading-tight break-words">{p.name}</span>
                {p.members && <span className="hidden lg:block text-xs font-semibold text-muted break-words" title={p.members.join(', ')}>{p.members.join(', ')}</span>}
              </span>
              {top.some((l) => l.id === p.id) && <Crown weight="fill" size={20} className="text-accent" aria-hidden="true" />}
              <motion.span key={p.score} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="font-display text-2xl font-bold tabular-nums min-w-[2.75rem] text-center rounded-pill bg-surface border-[2px] border-border px-2 py-0.5" aria-label={t('share.points', { count: p.score })}>{p.score}</motion.span>
            </motion.li>
          );
        })}
        {/* Small screens: the round sits at the end of the one row, so the board keeps its room. */}
        {round && <li className="lg:hidden shrink-0 self-center px-2 text-xs font-bold tabular-nums whitespace-nowrap">{round}</li>}
      </ol>
      {now && <p className="sr-only" aria-live="polite">{t('share.whoseTurn', { name: now.name })}</p>}
    </aside>
    {round && <RoundMeter round={round} label={roundLabel} className="hidden lg:block mt-auto self-stretch" />}
    </div>
  );
}
