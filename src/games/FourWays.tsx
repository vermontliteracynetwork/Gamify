import { motion } from 'motion/react';
import { useReducedMotion } from '../ui/useReducedMotion';
import type { PlayMode } from '../data/types';
import { SHOWN_MODES } from './ModeBadge';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import Title from '../ui/Title';
import { MODE_COLORS, MODE_ICONS } from './ModeBadge';
import { WAY_CARD, WAY_SHADOW, WayScene } from './WayCard';

// The four ways to play (teacher, 2026-10-31: "formatted evenly, more
// interesting and more catching"): four cards built the same way, a little
// scene for each, the name in the Gamify font and one line on what it is.
// `compact` is the reminder strip on the teacher's games page.
// With `filter`, the compact cards are buttons that filter the games below
// (teacher, 2026-11-06); tap again to show all.
export default function FourWays({ compact = false, filter, onFilter }: { compact?: boolean; filter?: PlayMode | null; onFilter?: (m: PlayMode | null) => void }) {
  const reduce = useReducedMotion();
  return (
    <ul className={`grid list-none p-0 m-0 ${compact ? 'grid-cols-3 gap-2' : 'sm:grid-cols-3 gap-5 sm:auto-rows-fr'}`} aria-label={t('public.modesTitle')}>
      {SHOWN_MODES.map((m, i) => (
        <motion.li key={m} initial={reduce ? false : { opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: reduce ? 0 : i * 0.08 }}
          className={compact ? '' : 'grid'}>
          {compact ? <Compact mode={m} on={filter === m} dim={!!filter && filter !== m} onClick={onFilter ? () => onFilter(filter === m ? null : m) : undefined} /> : <WayInfo mode={m} />}
        </motion.li>
      ))}
    </ul>
  );
}

const card = 'bg-surface border-bold border-border rounded-panel overflow-hidden';

function Compact({ mode: m, on = false, dim = false, onClick }: { mode: PlayMode; on?: boolean; dim?: boolean; onClick?: () => void }) {
  const Icon = MODE_ICONS[m];
  const Tag = onClick ? 'button' : 'span';
  return (
    <Tag {...(onClick ? { type: 'button' as const, onClick, 'aria-pressed': on, 'data-tip': t('ways.filterTip', { mode: t(`mode.${m}` as StringKey) }) } : {})}
      className={`${card} w-full text-left flex items-center gap-3 p-2 pr-3 h-full motion-safe:transition-[opacity,transform] ${on ? 'ring-4 ring-border ring-offset-4 ring-offset-paper -translate-y-0.5' : ''} ${dim ? 'opacity-55' : ''}`} style={{ boxShadow: on ? '0 5px 0 var(--ink)' : 'var(--shadow-sticker)' }}>
      <span className="shrink-0 w-12 h-12 rounded-full border-bold border-border flex items-center justify-center" style={{ background: MODE_COLORS[m] }}><Icon weight="fill" size={26} aria-hidden="true" /></span>
      <span className="grid gap-0 min-w-0">
        <span className="font-display font-bold leading-tight text-lg"><Title text={t(`mode.${m}` as StringKey)} /></span>
        <span className="font-bold text-xs text-muted">{t(`mode.${m}.hint` as StringKey)}</span>
      </span>
    </Tag>
  );
}

// Home's cards are the setup menu's way-to-play cards (owner, 2026-11-25:
// "match the design thats on the game menu selection so its more
// prominent"): the same picture band, name and line, read-only, with the
// one-line pitch under it. No way has its own explainer page yet.
function WayInfo({ mode: m }: { mode: PlayMode }) {
  return (
    <div className={`${WAY_CARD} h-full`} style={{ boxShadow: WAY_SHADOW }}>
      <WayScene mode={m} className="aspect-[16/9] sm:aspect-[4/3]" />
      <span className="px-4 py-3 grid gap-1 content-start flex-1">
        <span className="font-display text-[1.75rem] font-bold leading-tight">{t(`mode.${m}` as StringKey)}</span>
        <span className="font-bold leading-snug">{t(`mode.${m}.hint` as StringKey)}.</span>
        <span className="font-semibold text-sm leading-snug text-muted">{t(`public.mode.${m}` as StringKey)}</span>
      </span>
    </div>
  );
}
