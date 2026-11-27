import { Timer } from '@phosphor-icons/react';
import { LAUNCH_OFFER } from '../config';
import { t } from '../i18n';
import { saleLive } from './LaunchSaleBanner';

// A small, true urgency line under sign-up buttons (owner, 2026-11-27:
// "always promote signing up now, a slight level of urgency especially around
// sales and deals, and make it seem like signing up is always so easy"). It
// names the real end date of a real sale (never fake scarcity, the marketing
// bible) and says how quick the start is. Teacher and parent pages only.
export default function SaleNudge({ className = '' }: { className?: string }) {
  const sale = saleLive();
  const days = Math.max(1, Math.ceil((Date.parse(`${LAUNCH_OFFER.endsBefore}T00:00:00-05:00`) - Date.now()) / 86_400_000));
  return (
    <p className={`m-0 inline-flex flex-wrap items-center gap-2 font-bold ${className}`}>
      {sale && <span className="inline-flex items-center gap-1.5 rounded-pill px-3 min-h-9 text-white border-std border-border" style={{ background: '#e0218a' }}><Timer weight="bold" size={16} aria-hidden="true" />{t('nudge.sale', { name: LAUNCH_OFFER.name, off: Math.round(LAUNCH_OFFER.discount * 100), days })}</span>}
      <span>{t('nudge.easy')}</span>
    </p>
  );
}
