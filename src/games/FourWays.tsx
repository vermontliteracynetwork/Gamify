import { motion, useReducedMotion } from 'motion/react';
import { DeviceTablet, Lightning, ProjectorScreen, Robot, Star, User, Users } from '@phosphor-icons/react';
import { ALL_MODES, type PlayMode } from '../data/types';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import Title from '../ui/Title';
import { MODE_COLORS, MODE_ICONS } from './ModeBadge';

// The four ways to play (teacher, 2026-10-31: "formatted evenly, more
// interesting and more catching"): four cards built the same way, a little
// scene for each, the name in the Gamify font and one line on what it is.
// `compact` is the reminder strip on the teacher's games page.
export default function FourWays({ compact = false }: { compact?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <ul className={`grid list-none p-0 m-0 ${compact ? 'grid-cols-2 lg:grid-cols-4 gap-2' : 'sm:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-fr'}`} aria-label={t('public.modesTitle')}>
      {ALL_MODES.map((m, i) => {
        const Icon = MODE_ICONS[m];
        return (
          <motion.li key={m} initial={reduce ? false : { opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: reduce ? 0 : i * 0.08 }}
            className={`bg-surface border-[2.5px] border-border rounded-panel overflow-hidden flex ${compact ? 'items-center gap-3 p-2 pr-3' : 'flex-col'}`} style={{ boxShadow: 'var(--shadow-sticker)' }}>
            {compact ? (
              <span className="shrink-0 w-12 h-12 rounded-full border-[2.5px] border-border flex items-center justify-center" style={{ background: MODE_COLORS[m] }}><Icon weight="fill" size={26} aria-hidden="true" /></span>
            ) : (
              <span className="relative h-32 border-b-[2.5px] border-border flex items-center justify-center" style={{ background: MODE_COLORS[m] }} aria-hidden="true">
                <Scene mode={m} />
              </span>
            )}
            <span className={`grid ${compact ? 'gap-0 min-w-0' : 'gap-1.5 p-4 flex-1 content-start'}`}>
              <span className={`title-bubble ${compact ? 'text-xl' : 'text-3xl'} flex items-center gap-2`}>{!compact && <Icon weight="bold" size={26} aria-hidden="true" />}<Title text={t(`mode.${m}` as StringKey)} /></span>
              <span className={`font-bold ${compact ? 'text-xs text-muted truncate' : 'text-sm'}`}>{t(`mode.${m}.hint` as StringKey)}</span>
              {!compact && <span className="font-semibold text-sm text-muted">{t(`public.mode.${m}` as StringKey)}</span>}
            </span>
          </motion.li>
        );
      })}
    </ul>
  );
}

// A small picture of each way to play, drawn with icons.
function Scene({ mode }: { mode: PlayMode }) {
  const dot = 'rounded-full border-[2.5px] border-border bg-surface flex items-center justify-center';
  if (mode === 'live') {
    return (
      <span className="flex items-end gap-2">
        {[0, 1, 2].map((k) => <span key={k} className={`${dot} !rounded-input w-14 h-[4.5rem] ${k === 1 ? '-translate-y-2' : ''}`}><DeviceTablet weight="fill" size={30} /></span>)}
      </span>
    );
  }
  if (mode === 'share') {
    return (
      <span className="grid justify-items-center gap-1.5">
        <span className={`${dot} !rounded-input w-28 h-14`}><ProjectorScreen weight="fill" size={34} /></span>
        <span className="flex gap-1.5">{['#f6c544', '#5cc3a0', '#6aa9e9', '#f2735f'].map((c) => <span key={c} className="w-5 h-5 rounded-full border-[2px] border-border" style={{ background: c }} />)}</span>
      </span>
    );
  }
  if (mode === 'solo') {
    return (
      <span className="relative">
        <span className={`${dot} w-[4.5rem] h-[4.5rem]`}><User weight="fill" size={38} /></span>
        <Star weight="fill" size={26} color="#f6c544" className="absolute -top-2 -right-4 drop-shadow-[0_0_1px_#000]" />
      </span>
    );
  }
  return (
    <span className="flex items-center gap-2">
      <span className={`${dot} w-16 h-16`}><Users weight="fill" size={32} /></span>
      <Lightning weight="fill" size={30} color="#241c3d" />
      <span className={`${dot} w-16 h-16`}><Robot weight="fill" size={32} /></span>
    </span>
  );
}
