import { motion } from 'motion/react';
import { HandWord, PowerSticker, Sprinkle, paperCss } from '../brand/ScrapbookKit';
import { PP } from '../brand/PaletteProposal';
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

export function saleLive(now = Date.now()) {
  return LAUNCH_OFFER.active && now < Date.parse(`${LAUNCH_OFFER.endsBefore}T00:00:00-05:00`);
}

// Scrapbook style (owner, 2026-11-27: "make the player one sale inline with
// our colors, scrapbook/crayon style design. use patterns and colors ...
// similar to the header hero on main page"): a pink gingham card, a taped
// striped paper with the 10% in Grow Year and a crayon power-up sticker, the
// sale name hand-lettered like the Home hero's word, a torn calendar page for
// the days left, and crayon stars.
const Tape = ({ rot, className = '' }: { rot: number; className?: string }) => <span aria-hidden="true" className={`absolute w-20 h-6 rounded-[0.2rem] bg-[#bfdff3]/85 border border-[#1d1a33]/25 ${className}`} style={{ transform: `rotate(${rot}deg)` }} />;
export default function LaunchSaleBanner() {
  const reduce = useReducedMotion();
  if (!saleLive()) return null;
  const off = Math.round(LAUNCH_OFFER.discount * 100);
  const days = Math.max(1, Math.ceil((Date.parse(`${LAUNCH_OFFER.endsBefore}T00:00:00-05:00`) - Date.now()) / 86_400_000));
  return (
    <motion.section aria-labelledby="sale-title" initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className="relative rounded-[1.75rem] border-[3.5px] border-border" style={{ boxShadow: `0 8px 0 ${INK}` }}>
      <span aria-hidden="true" className="absolute inset-0 rounded-[1.5rem] overflow-hidden" style={paperCss('gingham-pink', 3)} />
      <div className="relative grid gap-6 px-5 py-7 sm:px-8 sm:py-9 sm:grid-cols-[auto_minmax(0,1fr)] lg:grid-cols-[auto_minmax(0,1fr)_auto] items-center">
        {/* The taped striped paper with the 10%. */}
        <div className="relative justify-self-center sm:justify-self-start w-40 h-40 sm:w-48 sm:h-48 -rotate-6" aria-hidden="true">
          <span className="absolute inset-0 border-[3px] border-border rounded-[0.5rem]" style={{ ...paperCss('stripes', 5), boxShadow: `0 5px 0 ${INK}` }} />
          <Tape rot={-8} className="-top-3 left-8" />
          <span className="absolute inset-3 rounded-[0.4rem] bg-paper border-[2.5px] border-border grid place-items-center text-center">
            <span className="grid leading-none"><span className="font-display text-[3.4rem] sm:text-[4.2rem] leading-[0.9]">{off}%</span><span className="font-display text-2xl sm:text-3xl">{t('sale.off')}</span></span>
          </span>
          <span className="absolute -bottom-5 -right-6"><PowerSticker id="double-points" size={78} /></span>
        </div>

        <div className="relative grid gap-3 min-w-0">
          <span className="justify-self-start"><HandWord text={LAUNCH_OFFER.name} size={40} /></span>
          <div className="relative bg-paper border-[3px] border-border rounded-[0.6rem] p-4 sm:p-5 grid gap-2 rotate-[0.6deg]" style={{ boxShadow: `0 5px 0 ${INK}` }}>
            <Tape rot={4} className="-top-3 right-10" />
            <h2 id="sale-title" className="title-bubble text-[1.9rem] sm:text-[2.5rem] leading-[1.02] m-0">{t('sale.title')}</h2>
            <p className="text-lg font-bold leading-snug m-0">{t('sale.text', { off })}</p>
            <p className="text-sm font-semibold leading-snug m-0">{t('sale.renew')}</p>
          </div>
        </div>

        {/* A torn calendar page for the days left. */}
        <div className="relative justify-self-start lg:justify-self-end sm:col-span-2 lg:col-span-1 w-36 rotate-[5deg]" style={{ filter: `drop-shadow(0 5px 0 ${INK})` }}>
          <Tape rot={-6} className="-top-3 left-8 z-10" />
          <div className="rounded-[0.6rem] overflow-hidden border-[3px] border-border bg-paper text-center">
            <div className="h-9 grid place-items-center font-bold text-white text-sm tracking-wide uppercase border-b-[3px] border-border" style={{ background: '#c2185b' }}>{t('sale.ends')}</div>
            <div className="py-3 grid gap-0.5"><span className="font-display text-[3.2rem] leading-none tabular-nums">{days}</span><span className="font-bold">{t(days === 1 ? 'sale.dayLeft' : 'sale.daysLeft')}</span></div>
          </div>
        </div>
      </div>
      <span aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-visible">
        <Sprinkle spots={[[18, -10, 22, PP.lemon], [ '48%' as unknown as number, 6, 18, PP.sky], ['70%' as unknown as number, -12, 22, PP.kelly], ['96%' as unknown as number, '40%' as unknown as number, 20, PP.lemon], ['40%' as unknown as number, '94%' as unknown as number, 18, PP.grape, 'dot']]} />
      </span>
    </motion.section>
  );
}
