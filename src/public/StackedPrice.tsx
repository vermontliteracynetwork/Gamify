import { LAUNCH_OFFER, PRICES_USD, billingMonths, billingSavings, type Billing, type Tier } from '../config';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { saleLive } from './LaunchSaleBanner';

// The price as stacked savings (owner, 2026-11-27: "show a minus symbol to
// deduct the Player One Sale 10 percent in addition ... cross out total before
// additional discount. show that the discounts can be stacked for ultimate
// savings"). The standard monthly price struck through, each saving as a
// bright minus line, then the total in Grow Year. One short renewal line
// stays under it: a price must say what it renews at (ROSCA and state
// automatic-renewal rules, the marketing bible).
const BRIGHT = '#e0218a';
export default function StackedPrice({ plan, billing }: { plan: Exclude<Tier, 'free'>; billing: Billing }) {
  const months = billingMonths(billing);
  const standard = PRICES_USD[plan].month;
  const term = PRICES_USD[plan][billing];
  const perMonthTerm = term / months;
  const sale = saleLive();
  const off = Math.round(LAUNCH_OFFER.discount * 100);
  const final = perMonthTerm * (sale ? 1 - LAUNCH_OFFER.discount : 1);
  const lengthSave = billingSavings(plan, billing);
  const totalSave = Math.round((1 - final / standard) * 100);
  const m2 = (n: number) => (Math.round(n * 100) / 100).toFixed(2).replace(/\.00$/, '');
  return (
    <div className="grid gap-1.5">
      {/* The standard price in the same Grow Year size as Free's $0, struck when a saving applies. */}
      <p className="m-0 flex flex-wrap items-baseline gap-x-2"><span className={`font-score text-5xl leading-none tabular-nums ${lengthSave > 0 || sale ? 'line-through decoration-[3px] text-muted' : ''}`}>${m2(standard)}</span><span className="text-lg font-bold">{t('upgrade.perMonth')}</span></p>
      {lengthSave > 0 && <p className="m-0 font-bold tabular-nums" style={{ color: BRIGHT }}>−${m2(standard - perMonthTerm)} ({t(`pricing.stack.${billing}Name` as StringKey)} {lengthSave}% off)</p>}
      {sale && <p className="m-0 font-bold tabular-nums" style={{ color: BRIGHT }}>−${m2(perMonthTerm - final)} ({LAUNCH_OFFER.name} {off}% off)</p>}
      {(lengthSave > 0 || sale) && <p className="m-0 flex flex-wrap items-baseline gap-x-2"><span className="font-score text-5xl leading-none tabular-nums">${m2(final)}</span><span className="text-lg font-bold">{t('upgrade.perMonth')}</span></p>}
      {totalSave > 0 && <span className="justify-self-start rounded-pill px-3 min-h-8 inline-flex items-center text-sm font-bold text-white border-std border-border" style={{ background: BRIGHT }}>{t('pricing.stack.total', { pct: totalSave })}</span>}
      <p className="m-0 text-xs font-semibold text-muted">{sale ? t('pricing.stack.fine', { first: m2(term * (1 - LAUNCH_OFFER.discount)), n: m2(term), per: t(`cmp.per.${billing}` as StringKey) }) : t('pricing.stack.fineNoSale', { n: m2(term), per: t(`cmp.per.${billing}` as StringKey) })}</p>
    </div>
  );
}
