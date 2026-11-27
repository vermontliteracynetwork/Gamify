import { motion } from 'motion/react';
import { GameController, Sparkle, Star } from '@phosphor-icons/react';
import { LAUNCH_OFFER } from '../config';
import { t } from '../i18n';
import { useReducedMotion } from '../ui/useReducedMotion';

// The Player One Sale banner (owner, 2026-11-27: "improve this banner so its
// visual and more promotional. i dont want it to be called founding
// subscriber ... think more cute about like first gamers sale ... i want it
// to be larger, use more of bright colors from our pallette"). A Lemon card
// with cut-paper confetti, a Grape "10% off" sticker, the offer in one big
// line and a days-left chip (a true end date, never fake urgency). The
// renewal line always shows beside the price (ROSCA, the marketing bible).
// Teacher and parent pages only, never student pages.
const INK = '#1d1a33';
const BITS: [number, number, string, number, 'dot' | 'tri' | 'bar' | 'star'][] = [
  [4, 14, 'var(--color-pink)', -12, 'tri'], [18, 78, 'var(--color-sky)', 20, 'bar'], [36, 8, 'var(--color-teal)', 0, 'dot'],
  [52, 86, 'var(--color-pink)', 30, 'star'], [64, 10, 'var(--color-grape)', -24, 'bar'], [78, 80, 'var(--color-kelly)', 10, 'tri'],
  [90, 18, 'var(--color-sky)', 0, 'star'], [96, 64, 'var(--color-pink)', 0, 'dot'], [28, 50, 'var(--color-orange)', 45, 'dot'],
];

export function saleLive(now = Date.now()) {
  return LAUNCH_OFFER.active && now < Date.parse(`${LAUNCH_OFFER.endsBefore}T00:00:00-05:00`);
}

export default function LaunchSaleBanner() {
  const reduce = useReducedMotion();
  if (!saleLive()) return null;
  const off = Math.round(LAUNCH_OFFER.discount * 100);
  const days = Math.max(1, Math.ceil((Date.parse(`${LAUNCH_OFFER.endsBefore}T00:00:00-05:00`) - Date.now()) / 86_400_000));
  return (
    <motion.section aria-labelledby="sale-title" initial={reduce ? false : { opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className="relative overflow-hidden rounded-[1.75rem] border-[3.5px] border-border bg-lemon px-5 py-6 sm:px-8 sm:py-8 grid gap-5 sm:grid-cols-[auto_minmax(0,1fr)] lg:grid-cols-[auto_minmax(0,1fr)_auto] items-center"
      style={{ boxShadow: `0 8px 0 ${INK}` }}>
      {/* Cut-paper confetti behind everything (decoration only). */}
      <span aria-hidden="true" className="absolute inset-0 pointer-events-none">
        {BITS.map(([x, y, c, r, k], i) => (
          <span key={i} className="absolute" style={{ left: `${x}%`, top: `${y}%`, transform: `rotate(${r}deg)`, color: c }}>
            {k === 'dot' && <span className="block w-4 h-4 rounded-full" style={{ background: c, border: `2.5px solid ${INK}` }} />}
            {k === 'bar' && <span className="block w-8 h-3 rounded-full" style={{ background: c, border: `2.5px solid ${INK}` }} />}
            {k === 'tri' && <svg width="26" height="24" viewBox="0 0 26 24"><path d="M13 2 L24 22 H2 Z" fill={c} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" /></svg>}
            {k === 'star' && <Star weight="fill" size={26} />}
          </span>
        ))}
      </span>

      {/* The sticker: big, tilted, with a slow wobble. */}
      <motion.div aria-hidden="true" className="relative justify-self-center sm:justify-self-start w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-grape text-white grid place-items-center text-center border-[3.5px] border-border"
        style={{ boxShadow: `0 6px 0 ${INK}`, rotate: -8 }}
        animate={reduce ? undefined : { rotate: [-8, -3, -8] }} transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}>
        <span className="grid leading-none">
          <span className="font-display text-[3.4rem] sm:text-[4.2rem] leading-[0.9]">{off}%</span>
          <span className="font-display text-2xl sm:text-3xl leading-none">{t('sale.off')}</span>
        </span>
        <Sparkle weight="fill" size={30} className="absolute -top-1 -right-1 text-butter drop-shadow-[0_2px_0_#1d1a33]" />
      </motion.div>

      <div className="relative grid gap-2 min-w-0">
        <span className="justify-self-start inline-flex items-center gap-2 rounded-pill bg-pink text-white border-std border-border px-4 min-h-10 font-display text-xl sm:text-2xl leading-none uppercase" style={{ boxShadow: `0 3px 0 ${INK}` }}>
          <GameController weight="fill" size={24} aria-hidden="true" />{LAUNCH_OFFER.name}
        </span>
        <h2 id="sale-title" className="title-bubble text-[2rem] sm:text-[2.75rem] leading-[1.02] m-0">{t('sale.title')}</h2>
        <p className="text-lg sm:text-xl font-bold leading-snug m-0">{t('sale.text', { off })}</p>
        <p className="text-sm sm:text-base font-semibold leading-snug m-0">{t('sale.renew')}</p>
      </div>

      <div className="relative justify-self-start lg:justify-self-end grid justify-items-center gap-1 rounded-[1.25rem] bg-paper border-[3px] border-border px-5 py-3 sm:col-span-2 lg:col-span-1" style={{ boxShadow: `0 5px 0 ${INK}` }}>
        <span className="font-display text-[2.75rem] leading-none tabular-nums">{days}</span>
        <span className="font-bold text-base leading-tight">{t(days === 1 ? 'sale.dayLeft' : 'sale.daysLeft')}</span>
        <span className="text-xs font-bold text-muted">{t('sale.ends')}</span>
      </div>
    </motion.section>
  );
}
