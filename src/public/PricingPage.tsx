import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Minus } from '@phosphor-icons/react';
import { PRICES_USD_PER_YEAR, SCHOOL_MIN_SEATS, SCHOOL_SEAT_DISCOUNTS, schoolQuote, TIERS, type Tier } from '../config';
import { t } from '../i18n';
import { buttonClasses } from '../ui/kit';
import Title from '../ui/Title';
import PublicFooter from './PublicFooter';

// Compare plans and pricing (teacher-facing public page; student pages never
// show prices). Every number comes from src/config.ts.
const fmt = (n: number) => (Number.isFinite(n) ? String(n) : t('pricing.unlimited'));

export default function PricingPage() {
  const [seats, setSeats] = useState(10);
  const quote = schoolQuote(seats);
  const rows: { label: string; value: (tier: Tier) => string | boolean }[] = [
    { label: t('pricing.row.classes'), value: (x) => fmt(TIERS[x].classrooms) },
    { label: t('pricing.row.students'), value: (x) => fmt(TIERS[x].studentsPerClassroom) },
    { label: t('pricing.row.sets'), value: (x) => fmt(TIERS[x].savedQuestionSets) },
    { label: t('pricing.row.assigned'), value: (x) => fmt(TIERS[x].assignedSetsPerStudent) },
    { label: t('pricing.row.games'), value: (x) => (x === 'pro' ? t('pricing.allGamesEarly') : TIERS[x].allGames ? t('pricing.allGames') : t('pricing.freeGames')) },
    { label: t('pricing.row.themes'), value: (x) => ({ trial: t('pricing.themeTrial'), 'one-per-game': t('pricing.themeOne'), unlimited: t('pricing.unlimited') })[TIERS[x].themeBuilder] },
    { label: t('pricing.row.library'), value: (x) => TIERS[x].themesPlayable },
    { label: t('pricing.row.live'), value: (x) => TIERS[x].liveMonitorAndLock },
    { label: t('pricing.row.reports'), value: (x) => (Number.isFinite(TIERS[x].reportHistoryDays) ? t('pricing.days', { n: TIERS[x].reportHistoryDays }) : t('pricing.allTime')) },
    { label: t('pricing.row.access'), value: () => true },
  ];
  const tiers: Tier[] = ['free', 'plus', 'pro'];
  const price = (x: Tier) => (x === 'free' ? t('pricing.zero') : t('pricing.perYear', { n: PRICES_USD_PER_YEAR[x] }));

  return (
    <>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-10">
        <h1 className="title-bubble text-5xl mb-3"><Title text={t('pricing.title')} /></h1>
        <p className="text-lg font-bold mb-8 max-w-2xl">{t('pricing.sub')}</p>
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {tiers.map((x) => (
            <section key={x} className={`hover-lift rounded-panel border-[2.5px] border-border p-5 grid gap-3 content-start ${x === 'plus' ? 'bg-accent' : 'bg-surface'}`} style={{ boxShadow: 'var(--shadow-sticker)' }}>
              <h2 className="font-display text-3xl"><Title text={t(`pricing.${x}`)} /></h2>
              <p className="font-display text-4xl">{price(x)}</p>
              <p className="font-semibold">{t(`pricing.${x}.who`)}</p>
              <Link to="/login?mode=signup" className={buttonClasses(x === 'plus' ? 'secondary' : 'primary', 'hover-pop')}>{x === 'free' ? t('public.startFree') : t('pricing.try')}</Link>
            </section>
          ))}
        </div>
        <div className="overflow-x-auto bg-surface border-[2.5px] border-border rounded-panel">
          <table className="w-full min-w-[560px] text-left">
            <caption className="sr-only">{t('pricing.compare')}</caption>
            <thead><tr className="border-b-[2px] border-border">
              <th scope="col" className="p-3 font-display text-xl">{t('pricing.compare')}</th>
              {tiers.map((x) => <th key={x} scope="col" className="p-3 font-display text-xl">{t(`pricing.${x}`)}</th>)}
            </tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-b border-border-soft last:border-0">
                  <th scope="row" className="p-3 font-bold">{r.label}</th>
                  {tiers.map((x) => {
                    const v = r.value(x);
                    return <td key={x} className="p-3 font-semibold">{typeof v === 'boolean' ? (v ? <Check weight="bold" size={20} aria-label={t('pricing.yes')} /> : <Minus weight="bold" size={20} aria-label={t('pricing.no')} />) : v}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <section className="mt-8 bg-surface border-[2.5px] border-border rounded-panel p-5 grid gap-3" style={{ boxShadow: 'var(--shadow-sticker)' }}>
          <h2 className="font-display text-3xl"><Title text={t('pricing.schoolTitle')} /></h2>
          <p className="font-semibold">{t('pricing.schoolSub', { min: SCHOOL_MIN_SEATS, tiers: SCHOOL_SEAT_DISCOUNTS.slice().reverse().map((d) => t('pricing.tier', { seats: d.minSeats, off: Math.round(d.discount * 100) })).join(', ') })}</p>
          <label className="flex flex-wrap items-center gap-3 font-bold">{t('pricing.seats')}
            <input type="number" min={1} max={2000} value={seats} onChange={(e) => setSeats(Math.max(1, Number(e.target.value) || 1))} className="w-28 min-h-11 px-3 rounded-input border-[2px] border-border font-bold" />
          </label>
          <p className="font-display text-2xl" aria-live="polite">{quote ? t('pricing.quote', { per: quote.perSeat, total: quote.total.toLocaleString() }) : t('pricing.minSeats', { min: SCHOOL_MIN_SEATS })}</p>
          <p className="text-sm font-bold text-muted">{t('pricing.po')}</p>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
