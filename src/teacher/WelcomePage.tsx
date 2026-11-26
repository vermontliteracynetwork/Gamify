import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Check, Clock, HandHeart, Sparkle } from '@phosphor-icons/react';
import { LAUNCH_OFFER, PRICES_USD_PER_YEAR, TIERS, TRIAL, perMonthUSD } from '../config';
import { BETA } from '../beta/spec';
import { betaOpen, WELCOME_SEEN } from '../billing/trial';
import { openUpgrade, saleOn } from '../billing/Upgrade';
import { data } from '../data';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { useSettings } from '../settings/SettingsContext';
import { buttonClasses } from '../ui/kit';
import { PRESS, SPRING } from '../ui/motion';
import Title from '../ui/Title';

// The welcome screen, shown once right after a teacher makes her account
// (owner, 2026-11-26; docs/upgrade-strategy.md section 2). One screen, one
// decision: Plus (the bright Grape card, where her 7-day trial already
// runs), Pro beside it, and Start Free as the full yellow go button that is
// always in view. Below the plans, until the beta ends and while spots
// remain, the beta strip: what it asks first, then what it gives. Never a
// dark pattern: no timer, nothing picked for her, every price with its
// renewal line, Free one clear tap. Standard Gamify look, teacher page only.
const money = (n: number) => `$${n % 1 ? n.toFixed(2) : n}`;

export default function WelcomePage() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const still = settings.motion === 'still';
  const sale = saleOn();

  async function done(plan?: 'plus' | 'pro') {
    await data.setSetting(WELCOME_SEEN, true);
    navigate('/teacher');
    // Get Plus or Get Pro: the plan box (Stripe Checkout once it is set up).
    if (plan) setTimeout(() => openUpgrade(plan), 0);
  }

  const plusLines: string[] = [
    t('welcome.plus.games'),
    t('welcome.plus.classes', { classes: TIERS.plus.classrooms, students: TIERS.plus.studentsPerClassroom, free: TIERS.free.studentsPerClassroom }),
    t('welcome.plus.sets', { free: TIERS.free.savedQuestionSets }),
    t('welcome.plus.reports', { free: TIERS.free.reportHistoryDays }),
    t('welcome.plus.themes'),
    t('welcome.plus.live'),
  ];
  const proLines: StringKey[] = ['upgrade.pro.3', 'upgrade.pro.2', 'plans.pro.more.2', 'plans.pro.more.3'];
  const arrive = (i: number) => (still ? {} : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { ...SPRING.soft, delay: 0.06 * i } });
  const press = still ? {} : PRESS;

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 sm:pt-8 grid gap-4">
      <header className="grid gap-2">
        <span className="justify-self-start rounded-pill bg-mint border-std border-border px-3 py-1 text-sm font-bold inline-flex items-center gap-1.5"><Check weight="bold" size={16} aria-hidden="true" />{t('welcome.kicker')}</span>
        <h1 className="title-bubble text-4xl sm:text-5xl"><Title text={t('welcome.title')} /></h1>
        <p className="font-semibold text-lg m-0">{t('welcome.sub', { days: TRIAL.days })}</p>
      </header>

      <div className="grid md:grid-cols-[1.15fr_1fr] gap-4 items-stretch">
        {/* Plus: the bright card. Her trial is already Plus, so this is "keep it". */}
        <motion.section {...arrive(0)} aria-labelledby="w-plus" className="rounded-panel border-bold border-border bg-grape text-white p-5 sm:p-6 grid gap-3 content-start" style={{ boxShadow: 'var(--shadow-sticker-lg)' }}>
          <span className="justify-self-start rounded-pill bg-butter text-text border-std border-border px-3 py-1 text-sm font-bold inline-flex items-center gap-1.5"><Sparkle weight="fill" size={16} aria-hidden="true" />{t('welcome.plus.flag', { days: TRIAL.days })}</span>
          <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
            <h2 id="w-plus" className="font-display text-4xl m-0">{t('pricing.plus')}</h2>
            <p className="m-0 flex items-baseline gap-1.5"><span className="font-display text-4xl sm:text-5xl leading-none tabular-nums">{t('pricing.price', { m: perMonthUSD(PRICES_USD_PER_YEAR.plus) })}</span><span className="font-bold">{t('upgrade.perMonth')}</span></p>
          </div>
          <p className="m-0 font-semibold text-sm">{t('welcome.renews', { price: money(PRICES_USD_PER_YEAR.plus) })}</p>
          <motion.button type="button" {...press} onClick={() => void done('plus')} className="min-h-14 rounded-pill border-std border-border bg-white text-grape-deep font-bold text-lg inline-flex items-center justify-center gap-2 shadow-[0_3px_0_var(--ink)] hover:bg-surface-hover">
            {t('welcome.getPlus')}<ArrowRight weight="bold" size={20} aria-hidden="true" />
          </motion.button>
          <p className="m-0 -mt-1.5 text-sm font-semibold text-center">{t('welcome.billingNote')}</p>
          <h3 className="m-0 font-heading font-bold text-base">{t('welcome.plus.lead')}</h3>
          <ul className="grid gap-1.5 list-none p-0 m-0">
            {plusLines.map((l) => <li key={l} className="flex gap-2 font-semibold"><Check weight="bold" size={20} className="shrink-0 mt-0.5" aria-hidden="true" />{l}</li>)}
          </ul>
          {sale && <p className="m-0 text-sm font-semibold rounded-input bg-grape-deep text-white p-2.5">{t('welcome.sale', { name: LAUNCH_OFFER.name, off: Math.round(LAUNCH_OFFER.discount * 100) })}</p>}
        </motion.section>

        {/* Pro: same layout, the quieter card. */}
        <motion.section {...arrive(1)} aria-labelledby="w-pro" className="rounded-panel border-bold border-border bg-surface p-5 sm:p-6 grid gap-3 content-start" style={{ boxShadow: 'var(--shadow-sticker)' }}>
          <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
            <h2 id="w-pro" className="font-display text-4xl m-0">{t('pricing.pro')}</h2>
            <p className="m-0 flex items-baseline gap-1.5"><span className="font-display text-4xl sm:text-5xl leading-none tabular-nums">{t('pricing.price', { m: perMonthUSD(PRICES_USD_PER_YEAR.pro) })}</span><span className="font-bold">{t('upgrade.perMonth')}</span></p>
          </div>
          <p className="m-0 font-semibold text-sm text-muted">{t('welcome.renews', { price: money(PRICES_USD_PER_YEAR.pro) })}</p>
          <motion.button type="button" {...press} onClick={() => void done('pro')} className={buttonClasses('main', 'min-h-14 !text-lg', 'lg')}>
            {t('welcome.getPro')}<ArrowRight weight="bold" size={20} aria-hidden="true" />
          </motion.button>
          <p className="m-0 -mt-1.5 text-sm font-semibold text-center text-muted">{t('welcome.billingNote')}</p>
          <h3 className="m-0 font-heading font-bold text-base">{t('welcome.pro.lead')}</h3>
          <ul className="grid gap-1.5 list-none p-0 m-0">
            {proLines.map((k) => <li key={k} className="flex gap-2 font-semibold"><Check weight="bold" size={20} className="shrink-0 mt-0.5" aria-hidden="true" />{t(k)}</li>)}
          </ul>
        </motion.section>
      </div>

      {/* The beta strip: under the plans, the ask before the gift (filter 1). */}
      {betaOpen() && (
        <motion.section {...arrive(2)} aria-labelledby="w-beta" className="rounded-panel border-std border-border bg-butter p-4 sm:p-5 flex flex-wrap items-center gap-x-5 gap-y-3">
          <span className="w-12 h-12 rounded-full bg-surface border-std border-border grid place-items-center shrink-0"><HandHeart weight="fill" size={26} aria-hidden="true" /></span>
          <div className="flex-1 min-w-[16rem] grid gap-1">
            <h2 id="w-beta" className="font-heading font-bold text-xl m-0">{t('welcome.beta.title')}</h2>
            <p className="m-0 font-semibold flex gap-1.5"><Clock weight="bold" size={20} className="shrink-0 mt-0.5" aria-hidden="true" />{t('welcome.beta.ask')}</p>
            <p className="m-0 font-semibold">{t('welcome.beta.give', { months: BETA.months, spots: BETA.spots })}</p>
          </div>
          <Link to="/beta/apply" onClick={() => void data.setSetting(WELCOME_SEEN, true)} className={buttonClasses('secondary', 'min-h-12')}>{t('welcome.beta.apply')}<ArrowRight weight="bold" size={18} aria-hidden="true" /></Link>
        </motion.section>
      )}

      {/* Start Free: always in view at the foot of the screen, one tap. */}
      <div className="sticky bottom-0 z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 pt-2.5 pb-3 bg-cream border-t-[2.5px] border-border grid justify-items-center">
        <motion.button type="button" {...press} onClick={() => void done()} className={buttonClasses('go', 'w-full max-w-xl !text-xl', 'lg')}>
          {t('welcome.free')}
        </motion.button>
      </div>
    </main>
  );
}
