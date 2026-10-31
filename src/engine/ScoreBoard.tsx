import { motion } from 'motion/react';
import { Crown } from '@phosphor-icons/react';
import { t } from '../i18n';
import { useSettings } from '../settings/SettingsContext';
import { TeamBadge } from './TeamBadge';
import { leaders, type TurnState } from './turns';

// The scores beside every team game, the same in each (teacher, 2026-10-31:
// whose turn it is glows here, with no "pick a..." bar over the board). On
// small screens it is one row that scrolls sideways, so it never pushes the
// board off the screen. `round` is a line such as "Drop 2 of 6".
export default function ScoreBoard({ turns, playing, round }: { turns: TurnState; playing: boolean; round?: string }) {
  const { settings } = useSettings();
  const still = settings.motion === 'still';
  const now = playing ? turns.players[turns.turn] : null;
  const top = !playing ? leaders(turns) : [];
  const glow = '0 0 0 4px #fdfd94, 0 0 20px 6px #fdfd94';
  return (
    <aside className="order-first lg:order-none bg-surface border-[2.5px] border-border rounded-panel p-2 lg:p-4 grid gap-2 min-w-0" style={{ boxShadow: 'var(--shadow-sticker)' }} aria-label={t('share.scores')}>
      <div className="hidden lg:flex items-baseline justify-between gap-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted">{t('share.scores')}</h2>
        {round && <span className="text-xs font-bold tabular-nums">{round}</span>}
      </div>
      <ol className="flex flex-nowrap overflow-x-auto lg:overflow-visible lg:grid lg:grid-cols-1 gap-1.5 lg:gap-2 list-none m-0 p-1 lg:p-0">
        {turns.players.map((p) => {
          const on = now?.id === p.id;
          return (
            <motion.li key={p.id} aria-current={on ? 'true' : undefined}
              animate={on && !still ? { boxShadow: ['0 0 0 3px #fdfd94, 0 0 14px 4px #fdfd94', '0 0 0 4px #fdfd94, 0 0 26px 10px #fdfd94', '0 0 0 3px #fdfd94, 0 0 14px 4px #fdfd94'] } : { boxShadow: on ? glow : '0 0 0 0 transparent' }}
              transition={on && !still ? { duration: 1.6, repeat: Infinity } : { duration: 0.2 }}
              className={`shrink-0 lg:shrink flex items-center gap-2 rounded-input border-[2px] p-1.5 lg:p-2 ${on ? 'border-border bg-accent' : 'border-border-soft'}`}>
              <TeamBadge colorIndex={p.colorIndex} />
              <span className="flex-1 min-w-0 grid">
                <span className="font-bold truncate">{p.name}</span>
                {p.members && <span className="hidden lg:block text-xs font-semibold text-muted truncate" title={p.members.join(', ')}>{p.members.join(', ')}</span>}
              </span>
              {top.some((l) => l.id === p.id) && <Crown weight="fill" size={20} className="text-accent" aria-hidden="true" />}
              <motion.span key={p.score} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="font-display text-2xl font-bold tabular-nums" aria-label={t('share.points', { count: p.score })}>{p.score}</motion.span>
            </motion.li>
          );
        })}
        {/* Small screens: the round sits at the end of the one row, so the board keeps its room. */}
        {round && <li className="lg:hidden shrink-0 self-center px-2 text-xs font-bold tabular-nums whitespace-nowrap">{round}</li>}
      </ol>
      {now && <p className="sr-only" aria-live="polite">{t('share.whoseTurn', { name: now.name })}</p>}
    </aside>
  );
}
