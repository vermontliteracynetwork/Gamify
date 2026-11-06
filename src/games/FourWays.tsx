import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowArcLeft, ArrowArcRight, Check, DeviceTablet, Lightning, ProjectorScreen, Robot, Star, User, Users } from '@phosphor-icons/react';
import { ALL_MODES, type PlayMode } from '../data/types';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import Title from '../ui/Title';
import { MODE_COLORS, MODE_ICONS } from './ModeBadge';

// The four ways to play (teacher, 2026-10-31: "formatted evenly, more
// interesting and more catching"): four cards built the same way, a little
// scene for each, the name in the Gamify font and one line on what it is.
// `compact` is the reminder strip on the teacher's games page.
// With `filter`, the compact cards are buttons that filter the games below
// (teacher, 2026-11-06); tap again to show all.
export default function FourWays({ compact = false, filter, onFilter }: { compact?: boolean; filter?: PlayMode | null; onFilter?: (m: PlayMode | null) => void }) {
  const reduce = useReducedMotion();
  return (
    <ul className={`grid list-none p-0 m-0 ${compact ? 'grid-cols-2 lg:grid-cols-4 gap-2' : 'sm:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-fr'}`} aria-label={t('public.modesTitle')}>
      {ALL_MODES.map((m, i) => (
        <motion.li key={m} initial={reduce ? false : { opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: reduce ? 0 : i * 0.08 }}
          whileHover={reduce ? undefined : { y: -6, rotate: i % 2 ? 0.6 : -0.6 }} className={compact ? '' : 'grid'}>
          {compact ? <Compact mode={m} on={filter === m} dim={!!filter && filter !== m} onClick={onFilter ? () => onFilter(filter === m ? null : m) : undefined} /> : <FlipCard mode={m} />}
        </motion.li>
      ))}
    </ul>
  );
}

const card = 'bg-surface border-[2.5px] border-border rounded-panel overflow-hidden';

function Compact({ mode: m, on = false, dim = false, onClick }: { mode: PlayMode; on?: boolean; dim?: boolean; onClick?: () => void }) {
  const Icon = MODE_ICONS[m];
  const Tag = onClick ? 'button' : 'span';
  return (
    <Tag {...(onClick ? { type: 'button' as const, onClick, 'aria-pressed': on, 'data-tip': t('ways.filterTip', { mode: t(`mode.${m}` as StringKey) }) } : {})}
      className={`${card} w-full text-left flex items-center gap-3 p-2 pr-3 h-full motion-safe:transition-[opacity,transform] ${on ? 'ring-4 ring-accent -translate-y-0.5' : ''} ${dim ? 'opacity-55' : ''}`} style={{ boxShadow: on ? '0 5px 0 #000' : 'var(--shadow-sticker)' }}>
      <span className="shrink-0 w-12 h-12 rounded-full border-[2.5px] border-border flex items-center justify-center" style={{ background: MODE_COLORS[m] }}><Icon weight="fill" size={26} aria-hidden="true" /></span>
      <span className="grid gap-0 min-w-0">
        <span className="font-display font-bold leading-tight text-lg"><Title text={t(`mode.${m}` as StringKey)} /></span>
        <span className="font-bold text-xs text-muted line-clamp-2">{t(`mode.${m}.hint` as StringKey)}</span>
      </span>
    </Tag>
  );
}

// Each card flips over (teacher, 2026-10-31): hovering shows a "Ways to play"
// arrow at the bottom; it turns the card to the class setups that way suits.
// Touch screens always show the arrow. Reduced motion swaps without turning.
function FlipCard({ mode: m }: { mode: PlayMode }) {
  const reduce = useReducedMotion();
  const [back, setBack] = useState(false);
  const Icon = MODE_ICONS[m];
  const face = `${card} [grid-area:1/1] flex flex-col [backface-visibility:hidden] ${reduce ? '' : 'transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]'}`;
  const turn = (b: boolean) => ({ transform: reduce ? undefined : `rotateY(${b ? 180 : 0}deg)`, visibility: reduce ? (b ? 'hidden' : 'visible') : undefined, boxShadow: 'var(--shadow-sticker)' } as const);
  const flipBtn = 'mt-auto self-start inline-flex items-center gap-1.5 min-h-11 px-3 -ml-1 rounded-pill border-[2px] border-border font-bold text-sm hover-pop';
  return (
    <div className="group grid [perspective:1200px]">
      <div className={face} style={turn(back)} aria-hidden={back} {...((back ? { inert: "" } : {}) as object)}>
        <span className="relative h-32 border-b-[2.5px] border-border flex items-center justify-center" style={{ background: MODE_COLORS[m] }} aria-hidden="true"><Scene mode={m} /></span>
        <span className="grid gap-1.5 p-4 pb-3 flex-1 content-start">
          <span className="font-display font-bold leading-tight text-2xl flex items-center gap-2"><Icon weight="bold" size={26} aria-hidden="true" /><Title text={t(`mode.${m}` as StringKey)} /></span>
          <span className="font-bold text-sm">{t(`mode.${m}.hint` as StringKey)}</span>
          <span className="font-semibold text-sm text-muted">{t(`public.mode.${m}` as StringKey)}</span>
        </span>
        <span className="px-4 pb-4 flex">
          <button type="button" onClick={() => setBack(true)} aria-label={t('ways.flipFor', { mode: t(`mode.${m}` as StringKey) })}
            className={`${flipBtn} bg-accent transition-opacity opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100`}>
            {t('ways.flip')}<ArrowArcRight weight="bold" size={18} aria-hidden="true" />
          </button>
        </span>
      </div>
      <div className={face} style={{ ...turn(!back), transform: reduce ? undefined : `rotateY(${back ? 0 : -180}deg)` }} aria-hidden={!back} {...((!back ? { inert: "" } : {}) as object)}>
        <span className="px-4 py-3 border-b-[2.5px] border-border flex items-center gap-2" style={{ background: MODE_COLORS[m] }}>
          <Icon weight="fill" size={26} aria-hidden="true" />
          <span className="font-display font-bold text-2xl leading-tight"><Title text={t('ways.flip')} /></span>
        </span>
        <span className="grid gap-2 p-4 pb-3 flex-1 content-start">
          <span className="font-display font-bold text-lg leading-tight">{t(`mode.${m}` as StringKey)}</span>
          <ul className="grid gap-2 list-none p-0 m-0">
            {[1, 2, 3].map((n) => (
              <li key={n} className="flex gap-2 text-sm font-semibold"><Check weight="bold" size={18} className="shrink-0 mt-0.5" aria-hidden="true" />{t(`ways.back.${m}.${n}` as StringKey)}</li>
            ))}
          </ul>
        </span>
        <span className="px-4 pb-4 flex">
          <button type="button" onClick={() => setBack(false)} className={`${flipBtn} bg-surface-2`}>
            <ArrowArcLeft weight="bold" size={18} aria-hidden="true" />{t('ways.flipBack')}
          </button>
        </span>
      </div>
    </div>
  );
}

// A small picture of each way to play, drawn with icons, with a little
// motion of its own (teacher, 2026-10-31): tablets bob, team dots hop, the
// star twinkles, the lightning flashes. CSS loops (.fw-*) in index.css, so
// calm mode and reduced motion still them.
function Scene({ mode }: { mode: PlayMode }) {
  const dot = 'rounded-full border-[2.5px] border-border bg-surface flex items-center justify-center';
  if (mode === 'live') {
    return (
      <span className="flex items-end gap-2">
        {[0, 1, 2].map((k) => (
          <span key={k} className={k === 1 ? '-translate-y-2' : ''}>
            <span className={`${dot} !rounded-input w-14 h-[4.5rem] fw-bob`} style={{ animationDelay: `${k * 0.3}s` }}><DeviceTablet weight="fill" size={30} /></span>
          </span>
        ))}
      </span>
    );
  }
  if (mode === 'share') {
    return (
      <span className="grid justify-items-center gap-1.5">
        <span className={`${dot} !rounded-input w-28 h-14`}><ProjectorScreen weight="fill" size={34} /></span>
        <span className="flex gap-1.5">{['#f6c544', '#5cc3a0', '#6aa9e9', '#f2735f'].map((c, k) => (
          <span key={c} className="w-5 h-5 rounded-full border-[2px] border-border fw-hop" style={{ background: c, animationDelay: `${k * 0.18}s` }} />
        ))}</span>
      </span>
    );
  }
  if (mode === 'solo') {
    return (
      <span className="relative">
        <span className={`${dot} w-[4.5rem] h-[4.5rem]`}><User weight="fill" size={38} /></span>
        <span className="absolute -top-2 -right-4 fw-twinkle"><Star weight="fill" size={26} color="#f6c544" className="drop-shadow-[0_0_1px_#000]" /></span>
      </span>
    );
  }
  return (
    <span className="flex items-center gap-2">
      <span className={`${dot} w-16 h-16 fw-nudge`}><Users weight="fill" size={32} /></span>
      <span className="fw-flash"><Lightning weight="fill" size={30} color="#241c3d" /></span>
      <span className={`${dot} w-16 h-16 fw-nudge-l`}><Robot weight="fill" size={32} /></span>
    </span>
  );
}
