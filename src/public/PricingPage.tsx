import { useEffect, useState, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useReducedMotion } from '../ui/useReducedMotion';
import { ArrowDown, ArrowRight, Buildings, CaretDown, House, Check } from '@phosphor-icons/react';
import { BILLINGS, SCHOOL_MIN_SEATS, billingSavings, type Billing, type Tier } from '../config';
import { data, newId } from '../data';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { Button, Tabs, buttonClasses, fieldClasses } from '../ui/kit';
import Title from '../ui/Title';
import { ScrapbookPage } from './scrapbook/Shell';
import Accordion from '../ui/Accordion';
import CompareChart from './CompareChart';
import StackedPrice from './StackedPrice';
import SaleNudge from './SaleNudge';
import LaunchSaleBanner from './LaunchSaleBanner';

// Plans and pricing, value first (teacher, 2026-10-25): what a teacher gets
// comes before what it costs, the monthly price is the big number with the
// yearly bill small, Plus is marked as the best fit, every plan says what
// happens if you leave, and schools get a price and a quote without a sales
// call. Teacher-facing only: student pages never show prices. Every number
// comes from src/config.ts.
// The look is the /brand Scrapbook Pricing mockup in strength A (owner,
// 2026-11-26: "pricing=a but remove the recommended label"): the Cream
// ground, plain white scrapbook cards, nothing taped or tilted, no stickers.
// Plus keeps its Butter card and deeper shadow, with no label on it.
const CARD = 'sb-card';
// About what a yearly plan costs a school day (180 days), as on the approved mockup.
// One Grow Year size for section titles (the approved /brand Pricing mockup).
const H2 = 'title-bubble text-[2rem] sm:text-[2.75rem] leading-none';

export default function PricingPage() {
  const reduce = useReducedMotion();
  // Monthly, 3 months, 6 months or yearly (owner, 2026-11-24); yearly first, it saves the most.
  const [billing, setBilling] = useState<Billing>('year');
  // Links like /pricing#schools land on that section.
  useEffect(() => { const id = window.location.hash.slice(1); if (id) setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }), 50); }, [reduce]);
  const tiers: Tier[] = ['free', 'plus', 'pro'];
  // "Compare every feature" glides down to the chart.
  const toChart = (e: MouseEvent) => { e.preventDefault(); document.getElementById('compare')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); history.replaceState(null, '', '#compare'); };
  const enter = (i: number) => ({ initial: reduce ? false : { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { delay: reduce ? 0 : i * 0.06 } });

  return (
    <ScrapbookPage strength="A">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 grid gap-8 sm:gap-10">
        {/* The mockup's order: title, the line, the sale, the billing switch, the promises, the plans. */}
        <div>
          <h1 className="title-bubble mb-4"><Title text={t('pricing.title')} /></h1>
          <p className="text-lg sm:text-xl font-semibold leading-snug">{t('pricing.sub')}</p>
        </div>

        <LaunchSaleBanner />
        <Tabs value={billing} onChange={setBilling} label={t('pricing.billing')} className="justify-self-start mb-0"
          options={BILLINGS.map((b) => ({ id: b.id, label: b.id === 'month' ? t('pricing.billing.month') : t(`pricing.billing.${b.id}` as StringKey, { off: billingSavings('plus', b.id) }) }))} />
        <div className="grid md:grid-cols-3 gap-5 items-stretch pt-2">
          {tiers.map((x, i) => {
            return (
              <motion.section key={x} {...enter(i)} aria-labelledby={`plan-${x}`} className={`hover-lift rounded-panel border-border grid gap-4 content-start relative [&_li>svg]:text-kelly ${x === 'plus' ? 'bg-butter border-[3.5px] p-6 md:-mt-3.5 md:mb-3.5' : 'bg-white border-[3px] p-5 sm:p-6'}`} style={{ boxShadow: x === 'plus' ? '0 8px 0 var(--border)' : '0 5px 0 var(--border)' }}>
                {/* No Recommended label (owner, 2026-11-26); Plus still stands out by its Butter card. */}
                <h2 id={`plan-${x}`} className="title-bubble text-4xl flex items-center gap-2"><Title text={t(`pricing.${x}`)} /></h2>
                <p className="text-lg font-semibold leading-snug">{t(`pricing.${x}.who` as StringKey)}</p>
                {/* The four lines that sell it, then the full chart (teacher,
                    2026-11-25: "shorten each plan and then have a very detailed
                    comparison chart"; replaces every highlight on the card). */}
                <ul className="grid gap-2 list-none p-0 m-0">{[1, 2, 3, 4].map((n) => <li key={n} className="flex gap-2 font-semibold leading-snug"><Check weight="bold" size={20} className="shrink-0 mt-0.5" aria-hidden="true" />{t((x === 'free' ? `pricing.free.${n}` : `upgrade.${x}.${n}`) as StringKey)}</li>)}</ul>
                <a href="#compare" onClick={toChart} className="justify-self-start font-bold underline underline-offset-4 inline-flex items-center gap-1.5">{t('pricing.compareAll')}<ArrowDown weight="bold" size={16} aria-hidden="true" /></a>
                <div className="grid gap-1 pt-4 border-t-2 border-dashed border-border">
                  {x === 'free'
                    ? <><p className="font-score text-5xl leading-none tabular-nums m-0">{t('pricing.free.price')}</p><p className="font-semibold m-0">{t('pricing.free.note')}</p></>
                    : <StackedPrice plan={x as 'plus' | 'pro'} billing={billing} />}
                </div>
                <Link to={x === 'free' ? '/login?mode=signup' : `/login?mode=signup&plan=${x}`} className={buttonClasses('go', 'min-h-14 hover-pop font-score !text-2xl')}>
                  {t(`pricing.cta.${x}` as StringKey)}
                </Link>
              </motion.section>
            );
          })}
        </div>
        <Link to="/homeschool" className={`hover-lift flex flex-wrap items-center gap-3 ${CARD} p-4 no-underline text-text`}>
          <House weight="fill" size={30} aria-hidden="true" />
          <span className="grid flex-1 min-w-60"><span className="font-display text-2xl">{t('pricing.homeschoolLink')}</span><span className="font-semibold">{t('pricing.homeschoolLinkText')}</span></span>
          <ArrowRight weight="bold" size={24} aria-hidden="true" />
        </Link>


        <CompareChart titleClass={H2} />

        <SchoolPlans />

        {/* What is never behind a paywall, in public (teacher research, 2026-10-31). */}
        {/* What is never behind a paywall, in public (teacher research, 2026-10-31); folded so the page scans (owner, 2026-11-27). */}
        <details className={`${CARD} group p-5 sm:p-6`}>
          <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden flex items-center gap-4">
            <span className="w-12 h-12 rounded-full bg-mint border-std border-border grid place-items-center shrink-0" aria-hidden="true"><Check weight="bold" size={24} /></span>
            <span className="grid flex-1 min-w-0"><span id="always-free" className="font-display text-2xl leading-tight"><Title text={t('pricing.always.title')} /></span><span className="font-semibold">{t('pricing.always.text')}</span></span>
            <span className="w-9 h-9 rounded-full border-std border-border bg-surface grid place-items-center shrink-0"><CaretDown weight="bold" size={18} className="motion-safe:transition-transform group-open:rotate-180" aria-hidden="true" /></span>
          </summary>
          <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2.5 list-none p-0 mt-5 mb-0">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <li key={n} className="flex gap-2.5 font-semibold"><Check weight="bold" size={20} className="shrink-0 mt-0.5 text-kelly" aria-hidden="true" />{t(`pricing.always.${n}` as StringKey)}</li>)}
          </ul>
        </details>

        <section aria-labelledby="faq" className="grid gap-3">
          {/* "Good to Know" with a way to Help (teacher, 2026-11-24: never "questions teachers ask"). */}
          <div className="flex flex-wrap items-end justify-between gap-3"><h2 id="faq" className="font-display text-3xl"><Title text={t('pricing.faqTitle')} /></h2><Link to="/help" className="font-bold underline underline-offset-4 inline-flex items-center gap-1.5">{t('pricing.faqHelp')}<ArrowRight weight="bold" size={16} aria-hidden="true" /></Link></div>
          {/* FAQ structured data: search and AI answer tools read these (teacher, 2026-10-31). */}
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [1, 2, 3, 4, 5, 6].map((n) => ({ '@type': 'Question', name: t(`pricing.faq.${n}.q` as StringKey), acceptedAnswer: { '@type': 'Answer', text: t(`pricing.faq.${n}.a` as StringKey) } })) }) }} />
          <Accordion items={[1, 2, 3, 4, 5, 6].map((n) => ({ id: String(n), title: t(`pricing.faq.${n}.q` as StringKey), body: <p>{t(`pricing.faq.${n}.a` as StringKey)}</p> }))} />
        </section>

        <div className="grid justify-items-center gap-3 text-center">
          <Link to="/login?mode=signup" className={buttonClasses('go', 'hover-pop max-sm:w-full', 'lg')}>{t('public.startFree')}</Link>
          <p className="font-bold text-muted m-0">{t('pricing.closing')}</p>
          <SaleNudge />
        </div>
      </main>
    </ScrapbookPage>
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
  const field = fieldClasses('md');
  return (
    <section id="schools" aria-labelledby="school-title" className={`${CARD} !bg-mint p-6 sm:p-10 grid md:grid-cols-[1.2fr_1fr] gap-6 sm:gap-8 items-start scroll-mt-24`}>
      <div className="grid gap-4 content-start">
        <span className="w-12 h-12 rounded-full bg-surface border-bold border-border flex items-center justify-center wiggle-on-hover" aria-hidden="true"><Buildings weight="bold" size={24} /></span>
        <h2 id="school-title" className={H2}><Title text={t('pricing.schoolTitle')} /></h2>
        <p className="text-lg sm:text-xl font-semibold leading-snug">{t('pricing.schoolSub')}</p>
        <Link to="/schools" className="font-bold justify-self-start underline underline-offset-4">{t('pricing.schoolMore')}</Link>
        <ul className="grid gap-2.5 list-none p-0 m-0">
          {[1, 2, 3, 4].map((n) => <li key={n} className="flex gap-3 items-start font-semibold leading-snug text-lg"><span className="mt-0.5 w-7 h-7 shrink-0 rounded-full bg-kelly border-std border-border flex items-center justify-center" aria-hidden="true"><Check weight="bold" size={15} /></span>{t(`pricing.school.${n}` as StringKey)}</li>)}
        </ul>
        <div className="bg-butter border-bold border-border rounded-panel p-5 grid gap-3">
          <p className="font-display text-2xl leading-tight">{t('pricing.savingsNoPrice', { min: SCHOOL_MIN_SEATS })}</p>
          <p className="text-sm font-bold">{t('pricing.po')} <Link to="/pricing/purchase-order">{t('po.link')}</Link></p>
          <PrincipalNote />
        </div>
      </div>
        <div className="bg-white border-[3px] border-border rounded-panel p-5 sm:p-6 grid gap-3">
          <h3 className="font-display text-2xl leading-tight"><Title text={t('pricing.quoteTitle')} /></h3>
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
              <Button variant="main" className="justify-self-start min-h-14 px-8 text-lg hover-pop" disabled={!ready || busy} onClick={() => void send()}>{t('pricing.getQuote')}</Button>
            </>
          )}
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
    <details className="bg-surface border-std border-border rounded-input p-3">
      <summary className="font-bold cursor-pointer">{t('pricing.noteTitle')}</summary>
      <p className="font-semibold text-sm mt-2 mb-2 whitespace-pre-line">{note}</p>
      <Button onClick={async () => { try { await navigator.clipboard.writeText(note); setCopied(true); } catch { setCopied(false); } }}>{copied ? t('pricing.noteCopied') : t('pricing.noteCopy')}</Button>
    </details>
  );
}

