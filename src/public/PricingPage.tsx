import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Buildings, House, Check, CreditCard, Heart, Minus, PaintBrush, ShieldCheck, Trash } from '@phosphor-icons/react';
import { PRICES_USD_PER_YEAR, SCHOOL_MIN_SEATS, TIERS, type Tier } from '../config';
import { data, newId } from '../data';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { Button, buttonClasses } from '../ui/kit';
import Title from '../ui/Title';
import PublicFooter from './PublicFooter';

// Plans and pricing, value first (teacher, 2026-10-25): what a teacher gets
// comes before what it costs, the monthly price is the big number with the
// yearly bill small, Plus is marked as the best fit, every plan says what
// happens if you leave, and schools get a price and a quote without a sales
// call. Teacher-facing only: student pages never show prices. Every number
// comes from src/config.ts.
const fmt = (n: number) => (Number.isFinite(n) ? String(n) : t('pricing.unlimited'));
const monthly = (x: Exclude<Tier, 'free'>) => (PRICES_USD_PER_YEAR[x] / 12).toFixed(0);

export default function PricingPage() {
  const reduce = useReducedMotion();
  // Links like /pricing#schools land on that section.
  useEffect(() => { const id = window.location.hash.slice(1); if (id) setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }), 50); }, [reduce]);
  const rows: { label: string; value: (tier: Tier) => string | boolean }[] = [
    { label: t('pricing.row.games'), value: (x) => (x === 'pro' ? t('pricing.allGamesEarly') : TIERS[x].allGames ? t('pricing.allGames') : t('pricing.freeGames')) },
    { label: t('pricing.row.themes'), value: (x) => ({ trial: t('pricing.themeTrial'), 'one-per-game': t('pricing.themeOne'), 'three-per-game': t('pricing.themeThree'), unlimited: t('pricing.unlimited') })[TIERS[x].themeBuilder] },
    { label: t('pricing.row.library'), value: (x) => TIERS[x].themesPlayable },
    { label: t('pricing.row.classes'), value: (x) => (x === 'free' ? false : fmt(TIERS[x].classrooms)) },
    { label: t('pricing.row.students'), value: (x) => fmt(TIERS[x].studentsPerClassroom) },
    { label: t('pricing.row.pictures'), value: (x) => (x === 'free' ? t('pricing.pictures.free') : t('pricing.pictures.paid')) },
    { label: t('pricing.row.sets'), value: (x) => fmt(TIERS[x].savedQuestionSets) },
    { label: t('pricing.row.homework'), value: (x) => (x === 'free' ? t('pricing.homework.free') : t('pricing.homework.paid')) },
    { label: t('pricing.row.groups'), value: (x) => x !== 'free' },
    { label: t('pricing.row.assigned'), value: (x) => fmt(TIERS[x].assignedSetsPerStudent) },
    { label: t('pricing.row.live'), value: (x) => TIERS[x].liveMonitorAndLock },
    { label: t('pricing.row.reports'), value: (x) => (Number.isFinite(TIERS[x].reportHistoryDays) ? t('pricing.days', { n: TIERS[x].reportHistoryDays }) : t('pricing.allTime')) },
    { label: t('pricing.row.access'), value: () => true },
  ];
  const tiers: Tier[] = ['free', 'plus', 'pro'];
  const enter = (i: number) => ({ initial: reduce ? false : { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { delay: reduce ? 0 : i * 0.06 } });
  const trust = [
    { icon: CreditCard, text: t('pricing.trust.card') },
    { icon: Heart, text: t('pricing.trust.cancel') },
    { icon: Trash, text: t('pricing.trust.keep') },
    { icon: ShieldCheck, text: t('pricing.trust.access') },
  ];

  return (
    <>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 grid gap-8">
        <div>
          <h1 className="title-bubble text-5xl mb-3"><Title text={t('pricing.title')} /></h1>
          <p className="text-xl font-bold max-w-2xl">{t('pricing.sub')}</p>
          <ul className="flex flex-wrap gap-2 list-none p-0 mt-4 mb-0">
            {trust.map(({ icon: I, text }) => <li key={text} className="inline-flex items-center gap-1.5 bg-surface border-[2px] border-border rounded-pill px-3 min-h-10 font-bold text-sm"><I weight="fill" size={18} aria-hidden="true" />{text}</li>)}
          </ul>
        </div>

        <div className="grid md:grid-cols-3 gap-4 items-stretch">
          {tiers.map((x, i) => {
            return (
              <motion.section key={x} {...enter(i)} aria-labelledby={`plan-${x}`} className={`hover-lift rounded-panel border-[2.5px] border-border p-5 grid gap-3 content-start relative ${x === 'plus' ? 'bg-accent md:-mt-3 md:mb-3' : 'bg-surface'}`} style={{ boxShadow: x === 'plus' ? 'var(--shadow-sticker-lg)' : 'var(--shadow-sticker)' }}>
                {x === 'plus' && <span className="absolute -top-4 right-5 bg-text text-white font-display rounded-pill px-3 py-1 text-sm">{t('upgrade.best')}</span>}
                <h2 id={`plan-${x}`} className="font-display text-3xl flex items-center gap-2"><Title text={t(`pricing.${x}`)} /></h2>
                <p className="text-lg font-bold">{t(`pricing.${x}.who` as StringKey)}</p>
                <ul className="grid gap-2 list-none p-0 m-0">
                  {[1, 2, 3, 4].map((n) => <li key={n} className="flex gap-2 font-semibold"><Check weight="bold" size={20} className="shrink-0 mt-0.5" aria-hidden="true" />{t((x === 'free' ? `pricing.free.${n}` : `upgrade.${x}.${n}`) as StringKey)}</li>)}
                </ul>
                <div className="mt-1">
                  {x === 'free'
                    ? <><p className="font-display text-4xl leading-none">{t('pricing.freeForever')}</p><p className="text-sm font-semibold text-muted">{t('pricing.noCard')}</p></>
                    : <><p className="font-display text-4xl leading-none">{t('upgrade.price', { m: monthly(x) })} <span className="text-lg whitespace-nowrap">{t('upgrade.perMonth')}</span></p><p className="text-sm font-semibold text-muted">{t('upgrade.billed', { n: PRICES_USD_PER_YEAR[x] })}</p></>}
                </div>
                <Link to={x === 'free' ? '/login?mode=signup' : `/login?mode=signup&plan=${x}`} className={buttonClasses('primary', `min-h-14 text-lg hover-pop ${x === 'plus' ? '!bg-text !text-white' : ''}`)}>
                  {x === 'free' ? t('public.startFree') : t('pricing.startWith', { plan: t(`pricing.${x}`) })}
                </Link>
              </motion.section>
            );
          })}
        </div>
        <Link to="/homeschool" className="hover-lift flex flex-wrap items-center gap-3 bg-surface border-[2.5px] border-border rounded-panel p-4 no-underline text-text" style={{ boxShadow: 'var(--shadow-sticker)' }}>
          <House weight="fill" size={30} aria-hidden="true" />
          <span className="grid flex-1 min-w-60"><span className="font-display text-2xl">{t('pricing.homeschoolLink')}</span><span className="font-semibold">{t('pricing.homeschoolLinkText')}</span></span>
          <ArrowRight weight="bold" size={24} aria-hidden="true" />
        </Link>

        <section aria-labelledby="themes-value" className="bg-surface border-[2.5px] border-border rounded-panel p-5 grid sm:grid-cols-[auto_1fr_auto] gap-4 items-center" style={{ boxShadow: 'var(--shadow-sticker)' }}>
          <span className="w-16 h-16 rounded-full bg-accent border-[2.5px] border-border flex items-center justify-center wiggle-on-hover"><PaintBrush weight="fill" size={32} aria-hidden="true" /></span>
          <div>
            <h2 id="themes-value" className="font-display text-2xl"><Title text={t('pricing.themesTitle')} /></h2>
            <p className="font-semibold">{t('pricing.themesText')}</p>
          </div>
          <Link to="/features" className={buttonClasses('secondary', 'hover-pop')}>{t('pricing.themesLink')}</Link>
        </section>

        <div className="overflow-x-auto bg-surface border-[2.5px] border-border rounded-panel">
          <table className="w-full min-w-[560px] text-left">
            <caption className="sr-only">{t('pricing.compare')}</caption>
            <thead><tr className="border-b-[2px] border-border">
              <th scope="col" className="p-3 font-display text-xl">{t('pricing.compare')}</th>
              {tiers.map((x) => <th key={x} scope="col" className={`p-3 font-display text-xl ${x === 'plus' ? 'bg-accent' : ''}`}>{t(`pricing.${x}`)}</th>)}
            </tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-b border-border-soft last:border-0">
                  <th scope="row" className="p-3 font-bold">{r.label}</th>
                  {tiers.map((x) => {
                    const v = r.value(x);
                    return <td key={x} className={`p-3 font-semibold ${x === 'plus' ? 'bg-accent/40' : ''}`}>{typeof v === 'boolean' ? (v ? <Check weight="bold" size={20} aria-label={t('pricing.yes')} /> : <Minus weight="bold" size={20} aria-label={t('pricing.no')} />) : v}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SchoolPlans />

        <section aria-labelledby="faq" className="grid gap-3">
          <h2 id="faq" className="font-display text-3xl"><Title text={t('pricing.faqTitle')} /></h2>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <details key={n} className="bg-surface border-[2px] border-border rounded-input p-4">
              <summary className="font-display text-xl cursor-pointer">{t(`pricing.faq.${n}.q` as StringKey)}</summary>
              <p className="font-semibold mt-2 mb-0">{t(`pricing.faq.${n}.a` as StringKey)}</p>
            </details>
          ))}
        </section>
      </main>
      <PublicFooter />
    </>
  );
}

// Schools and districts: the value first, then a quote request that needs
// no sales call. The price is not shown here: the quote arrives by email as
// a PDF (teacher, 2026-10-26), and the request reaches the owner dashboard.
function SchoolPlans() {
  const [form, setForm] = useState({ name: '', email: '', school: '', seats: 10, notes: '' });
  const [sent, setSent] = useState<'emailed' | 'queued' | null>(null);
  const [busy, setBusy] = useState(false);
  const ready = form.name.trim() && /\S+@\S+\.\S+/.test(form.email) && form.school.trim() && form.seats >= 1;
  async function send() {
    if (!ready) return;
    setBusy(true);
    await data.sendFeedback({
      id: newId('fb'), at: new Date().toISOString(), kind: 'quote', role: 'teacher', where: '/pricing', device: navigator.userAgent,
      details: `Quote request: ${form.name.trim()} <${form.email.trim()}>, ${form.school.trim()}, ${form.seats} teachers. ${form.notes.trim()}`.slice(0, 1000),
    });
    const res = await fetch('/api/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }).catch(() => null);
    setBusy(false);
    setSent(res?.ok ? 'emailed' : 'queued');
  }
  const field = 'min-h-12 px-3 rounded-input border-[2px] border-border font-bold bg-surface';
  return (
    <section id="schools" aria-labelledby="school-title" className="bg-surface border-[2.5px] border-border rounded-panel p-5 sm:p-6 grid gap-5 scroll-mt-24" style={{ boxShadow: 'var(--shadow-sticker)' }}>
      <div className="grid gap-2">
        <h2 id="school-title" className="title-bubble text-4xl flex items-center gap-3"><Buildings weight="fill" size={40} aria-hidden="true" className="wiggle-on-hover" /><Title text={t('pricing.schoolTitle')} /></h2>
        <p className="text-lg font-bold max-w-3xl">{t('pricing.schoolSub')}</p>
        <Link to="/schools" className="font-bold justify-self-start">{t('pricing.schoolMore')}</Link>
      </div>
      <ul className="grid sm:grid-cols-2 gap-3 list-none p-0 m-0">
        {[1, 2, 3, 4].map((n) => <li key={n} className="flex gap-2 font-semibold bg-surface-2 border-[2px] border-border rounded-input p-3"><Check weight="bold" size={20} className="shrink-0 mt-0.5" aria-hidden="true" />{t(`pricing.school.${n}` as StringKey)}</li>)}
      </ul>
      <div className="grid md:grid-cols-2 gap-5 items-start">
        <div className="bg-accent border-[2.5px] border-border rounded-panel p-5 grid gap-3">
          <p className="font-display text-2xl leading-tight">{t('pricing.savingsNoPrice', { min: SCHOOL_MIN_SEATS })}</p>
          <p className="text-sm font-bold">{t('pricing.po')}</p>
          <PrincipalNote />
        </div>
        <div className="grid gap-3">
          <h3 className="font-display text-2xl"><Title text={t('pricing.quoteTitle')} /></h3>
          {sent ? (
            <div className="grid gap-2" role="status">
              <p className="text-lg font-bold">{sent === 'emailed' ? t('pricing.quoteEmailed', { email: form.email.trim() }) : t('pricing.quoteQueued', { email: form.email.trim() })}</p>
            </div>
          ) : (
            <>
              <ol className="grid gap-1 pl-6 m-0 list-decimal font-semibold">{[1, 2, 3].map((n) => <li key={n}>{t(`pricing.quoteStep.${n}` as StringKey)}</li>)}</ol>
              <div className="grid gap-3">
                <label className="grid gap-1 font-bold">{t('beta.name')}<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={80} className={field} /></label>
                <label className="grid gap-1 font-bold">{t('beta.email')}<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={120} className={field} /></label>
                <label className="grid gap-1 font-bold">{t('pricing.schoolName')}<input value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} maxLength={120} className={field} /></label>
                <label className="grid gap-1 font-bold">{t('pricing.seats')}<input type="number" min={1} max={5000} value={form.seats} onChange={(e) => setForm({ ...form, seats: Math.max(1, Number(e.target.value) || 1) })} className={`${field} w-32`} /></label>
                <label className="grid gap-1 font-bold">{t('pricing.quoteNotes')}<textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} maxLength={500} rows={2} className={`${field} py-2`} /></label>
              </div>
              <Button variant="primary" className="justify-self-start min-h-14 px-8 text-lg hover-pop" disabled={!ready || busy} onClick={() => void send()}>{t('pricing.getQuote')}</Button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

// A note a teacher can copy and send to their principal (the teacher-first,
// school-second sales play): the value first, then the quote.
function PrincipalNote() {
  const [copied, setCopied] = useState(false);
  const note = t('pricing.note');
  return (
    <details className="bg-surface border-[2px] border-border rounded-input p-3">
      <summary className="font-bold cursor-pointer">{t('pricing.noteTitle')}</summary>
      <p className="font-semibold text-sm mt-2 mb-2 whitespace-pre-line">{note}</p>
      <Button onClick={async () => { try { await navigator.clipboard.writeText(note); setCopied(true); } catch { setCopied(false); } }}>{copied ? t('pricing.noteCopied') : t('pricing.noteCopy')}</Button>
    </details>
  );
}
