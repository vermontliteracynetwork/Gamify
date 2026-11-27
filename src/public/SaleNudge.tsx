import { BellRinging, Timer } from '@phosphor-icons/react';
import { LAUNCH_OFFER } from '../config';
import { t } from '../i18n';
import { saleLive } from './LaunchSaleBanner';

// A small, true urgency line under sign-up buttons (owner, 2026-11-27:
// "always promote signing up now, a slight level of urgency especially around
// sales and deals, and make it seem like signing up is always so easy"). It
// names the real end date of a real sale (never fake scarcity, the marketing
// bible) and says how quick the start is. Teacher and parent pages only.
export default function SaleNudge({ className = '', sticky = false }: { className?: string; sticky?: boolean }) {
  const sale = saleLive();
  const days = Math.max(1, Math.ceil((Date.parse(`${LAUNCH_OFFER.endsBefore}T00:00:00-05:00`) - Date.now()) / 86_400_000));
  // A tilted sticky note with a strip of tape (owner, 2026-11-27: "make it look
  // more like scrapbook sticky note sticker announcement").
  if (sticky) return (
    <div className={`relative w-64 max-w-full rotate-[3deg] ${className}`}>
      <span aria-hidden="true" className="absolute -top-3 left-1/2 -translate-x-1/2 -rotate-6 w-24 h-7 rounded-[0.25rem] bg-[#bfdff3]/80 border border-border/30" />
      <div className="p-5 pt-6 grid gap-2 border-[3px] border-border rounded-[0.6rem] text-text" style={{ background: 'linear-gradient(180deg,#fdfd94,#fff1b8)', boxShadow: '0 6px 0 var(--ink), 6px 10px 18px rgba(29,26,51,0.18)' }}>
        {sale && <>
          <span className="justify-self-start rounded-pill px-3 min-h-8 inline-flex items-center gap-1.5 text-sm font-bold text-white border-std border-border" style={{ background: '#e0218a' }}><Timer weight="bold" size={15} aria-hidden="true" />{t('nudge.days', { days })}</span>
          <p className="m-0 font-display text-[1.9rem] leading-[0.95]">{t('nudge.stickyTitle', { name: LAUNCH_OFFER.name, off: Math.round(LAUNCH_OFFER.discount * 100) })}</p>
        </>}
        <p className="m-0 font-bold leading-snug">{t('nudge.easy')}</p>
      </div>
    </div>
  );
  // Elsewhere: a notification card (owner, 2026-11-27: "make this more like a
  // notification announcement"): a bell, the sale and its days left, and the
  // easy line, on a white card with a magenta edge.
  return (
    <div role="note" className={`inline-grid grid-cols-[auto_minmax(0,1fr)] gap-3 items-center text-left rounded-[1.1rem] border-[3px] border-border bg-white pl-3 pr-5 py-3 max-w-xl ${className}`} style={{ boxShadow: '0 5px 0 var(--ink)', borderLeft: '10px solid #e0218a' }}>
      <span className="relative w-12 h-12 rounded-full grid place-items-center text-white border-std border-border" style={{ background: '#e0218a' }} aria-hidden="true">
        <BellRinging weight="fill" size={24} />
        {sale && <span className="absolute -top-1.5 -right-1.5 min-w-6 h-6 px-1 rounded-full bg-[#fdfd94] text-text border-2 border-border text-xs font-bold grid place-items-center">{days}</span>}
      </span>
      <span className="grid gap-0.5">
        {sale && <b className="font-heading text-lg leading-tight">{t('nudge.stickyTitle', { name: LAUNCH_OFFER.name, off: Math.round(LAUNCH_OFFER.discount * 100) })} <span className="inline-flex items-center gap-1 text-sm" style={{ color: '#e0218a' }}><Timer weight="bold" size={14} aria-hidden="true" />{t('nudge.days', { days })}</span></b>}
        <span className="text-sm font-semibold">{t('nudge.easy')}</span>
      </span>
    </div>
  );
}
