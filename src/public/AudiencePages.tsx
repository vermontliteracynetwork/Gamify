import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Brain, Buildings, ChalkboardTeacher, Check, FileText, Heart, House, LockKey, Rocket, ShieldCheck, Sparkle, UsersThree, X } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { PRICES_USD_PER_YEAR, SCHOOL_SEAT_DISCOUNTS } from '../config';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { buttonClasses } from '../ui/kit';
import Title from '../ui/Title';
import PublicFooter from './PublicFooter';
import { POSTS } from './posts';
import { GameCover } from '../games/covers';
import { FAQS } from './faq';

// Pages for each buyer (teacher, 2026-10-25): schools and districts, and
// homeschool families, plus the student data promise both ask about. Value
// first, the free start always visible, the price framed per teacher or per
// month, and every committee question answered with a link.
const card = 'bg-surface border-[2.5px] border-border rounded-panel p-5 grid gap-2 content-start';
type Icon = typeof Brain;

function Hero({ icon: I, kicker, title, sub, children }: { icon: Icon; kicker: string; title: string; sub: string; children: ReactNode }) {
  return (
    <section className="bg-accent border-[2.5px] border-border rounded-panel p-6 sm:p-8 grid gap-4" style={{ boxShadow: 'var(--shadow-sticker-lg)' }}>
      <p className="font-bold uppercase tracking-wider text-sm">{kicker}</p>
      <h1 className="title-bubble text-4xl sm:text-6xl flex items-center gap-3 min-w-0 break-words"><I weight="fill" size={52} aria-hidden="true" className="shrink-0 hidden sm:block wiggle-on-hover" /><Title text={title} /></h1>
      <p className="text-xl font-bold max-w-3xl">{sub}</p>
      <div className="flex flex-wrap gap-3">{children}</div>
    </section>
  );
}

function Pillars({ items }: { items: { icon: Icon; key: string }[] }) {
  const reduce = useReducedMotion();
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {items.map(({ icon: I, key }, i) => (
        <motion.article key={key} initial={reduce ? false : { opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: reduce ? 0 : i * 0.06 }}
          className={`${card} hover-lift`} style={{ boxShadow: 'var(--shadow-sticker)' }}>
          <span className="w-12 h-12 rounded-full bg-accent border-[2.5px] border-border flex items-center justify-center wiggle-on-hover"><I weight="fill" size={24} aria-hidden="true" /></span>
          <h3 className="font-display text-2xl"><Title text={t(`${key}` as StringKey)} /></h3>
          <p className="font-semibold">{t(`${key}.text` as StringKey)}</p>
        </motion.article>
      ))}
    </div>
  );
}

function FaqTeaser({ group }: { group: 'schools' | 'homeschool' }) {
  return (
    <section aria-labelledby="faq-teaser" className="grid gap-3">
      <h2 id="faq-teaser" className="font-display text-3xl"><Title text={t('aud.faqTitle')} /></h2>
      {FAQS[group].slice(0, 5).map((f) => (
        <details key={f.q} className="bg-surface border-[2px] border-border rounded-input p-4">
          <summary className="font-display text-xl cursor-pointer">{f.q}</summary>
          <p className="font-semibold mt-2 mb-0">{f.a}</p>
        </details>
      ))}
      <Link to={`/faq?for=${group}`} className={buttonClasses('secondary', 'justify-self-start hover-pop')}>{t('aud.allQuestions')}<ArrowRight weight="bold" size={18} /></Link>
    </section>
  );
}

export function SchoolsPage() {
  const pro = PRICES_USD_PER_YEAR.pro;
  return (
    <>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 grid gap-12">
        <Hero icon={Buildings} kicker={t('schools.kicker')} title={t('schools.title')} sub={t('schools.sub')}>
          <Link to="/pricing#schools" className={buttonClasses('primary', 'min-h-14 px-7 text-lg hover-pop !bg-text !text-white')}>{t('schools.quote')}</Link>
          <Link to="/beta" className={buttonClasses('secondary', 'min-h-14 px-7 text-lg hover-pop')}>{t('schools.pilot')}</Link>
        </Hero>

        <section aria-labelledby="why" className="grid gap-4">
          <h2 id="why" className="font-display text-4xl"><Title text={t('schools.whyTitle')} /></h2>
          <Pillars items={[{ icon: Brain, key: 'schools.p1' }, { icon: Heart, key: 'schools.p2' }, { icon: ShieldCheck, key: 'schools.p3' }, { icon: Rocket, key: 'schools.p4' }]} />
        </section>

        <section aria-labelledby="committee" className={card} style={{ boxShadow: 'var(--shadow-sticker)' }}>
          <h2 id="committee" className="font-display text-3xl flex items-center gap-2"><FileText weight="fill" size={30} aria-hidden="true" /><Title text={t('schools.committeeTitle')} /></h2>
          <p className="font-semibold">{t('schools.committeeSub')}</p>
          <ul className="grid sm:grid-cols-2 gap-2 list-none p-0 m-0">
            {([['privacy', '/student-data'], ['dpa', '/faq?for=schools'], ['a11y', '/accessibility'], ['it', '/it'], ['research', '/research'], ['price', '/pricing#schools']] as const).map(([k, to]) => (
              <li key={k}><Link to={to} className="hover-lift flex items-start gap-2 rounded-input border-[2px] border-border p-3 no-underline text-text bg-surface-2 h-full">
                <Check weight="bold" size={20} className="shrink-0 mt-0.5" aria-hidden="true" />
                <span><span className="font-bold block">{t(`schools.c.${k}` as StringKey)}</span><span className="text-sm font-semibold">{t(`schools.c.${k}.text` as StringKey)}</span></span>
              </Link></li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="rollout" className="grid gap-4">
          <h2 id="rollout" className="font-display text-4xl"><Title text={t('schools.rolloutTitle')} /></h2>
          <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 list-none p-0 m-0">
            {[1, 2, 3, 4].map((n) => (
              <li key={n} className={`${card} hover-lift`} style={{ boxShadow: 'var(--shadow-sticker)' }}>
                <span className="w-11 h-11 rounded-full bg-accent border-[2.5px] border-border flex items-center justify-center font-display text-xl">{n}</span>
                <h3 className="font-display text-2xl">{t(`schools.step.${n}` as StringKey)}</h3>
                <p className="font-semibold">{t(`schools.step.${n}.text` as StringKey)}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="value" className="grid gap-4">
          <h2 id="value" className="font-display text-4xl"><Title text={t('schools.valueTitle')} /></h2>
          <p className="text-lg font-semibold max-w-3xl">{t('schools.valueSub')}</p>
          <div className="grid sm:grid-cols-3 gap-4">
            {SCHOOL_SEAT_DISCOUNTS.slice().reverse().map((d) => {
              const per = Math.round(pro * (1 - d.discount));
              return (
                <div key={d.minSeats} className={`${card} text-center justify-items-center ${d.minSeats === 10 ? '!bg-accent' : ''}`} style={{ boxShadow: 'var(--shadow-sticker)' }}>
                  <p className="font-bold">{t('schools.tierTeachers', { n: d.minSeats })}</p>
                  <p className="font-display text-4xl">{t('schools.save', { off: Math.round(d.discount * 100) })}</p>
                  <p className="font-semibold">{t('schools.perTeacher', { per, month: (per / 12).toFixed(0) })}</p>
                </div>
              );
            })}
          </div>
          <p className="font-semibold text-muted">{t('schools.po')}</p>
        </section>

        <FaqTeaser group="schools" />

        <section className="bg-accent border-[2.5px] border-border rounded-panel p-6 grid gap-3 justify-items-center text-center" style={{ boxShadow: 'var(--shadow-sticker-lg)' }}>
          <h2 className="font-display text-4xl"><Title text={t('schools.endTitle')} /></h2>
          <p className="text-lg font-semibold max-w-2xl">{t('schools.endText')}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/pricing#schools" className={buttonClasses('primary', 'min-h-14 px-7 text-lg hover-pop !bg-text !text-white')}>{t('schools.quote')}</Link>
            <Link to="/login?mode=signup" className={buttonClasses('secondary', 'min-h-14 px-7 text-lg hover-pop')}>{t('public.startFree')}</Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}

export function HomeschoolPage() {
  const plus = (PRICES_USD_PER_YEAR.plus / 12).toFixed(0);
  return (
    <>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 grid gap-12">
        <Hero icon={House} kicker={t('hs.kicker')} title={t('hs.title')} sub={t('hs.sub')}>
          <Link to="/login?mode=signup" className={buttonClasses('primary', 'min-h-14 px-7 text-lg hover-pop !bg-text !text-white')}><ChalkboardTeacher weight="bold" size={22} />{t('hs.start')}</Link>
          <Link to="/faq?for=homeschool" className={buttonClasses('secondary', 'min-h-14 px-7 text-lg hover-pop')}>{t('hs.questions')}</Link>
        </Hero>

        <section aria-labelledby="fit" className="grid gap-4">
          <h2 id="fit" className="font-display text-4xl"><Title text={t('hs.fitTitle')} /></h2>
          <Pillars items={[{ icon: UsersThree, key: 'hs.p1' }, { icon: Sparkle, key: 'hs.p2' }, { icon: Heart, key: 'hs.p3' }, { icon: FileText, key: 'hs.p4' }]} />
        </section>

        {/* Homeschool-tagged blog posts (teacher, 2026-10-26), in place of the weekly plan. */}
        <section aria-labelledby="hs-posts" className="grid gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="hs-posts" className="font-display text-4xl"><Title text={t('hs.postsTitle')} /></h2>
              <p className="font-semibold">{t('hs.postsSub')}</p>
            </div>
            <Link to="/blog?tag=homeschool" className={buttonClasses('secondary', 'hover-pop')}>{t('hs.postsAll')}</Link>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {POSTS.filter((p) => p.tags?.includes('homeschool')).map((p) => (
              <Link key={p.slug} to={`/blog/${p.slug}`} className="hover-lift rounded-panel bg-surface border-[2.5px] border-border no-underline text-text overflow-hidden grid grid-cols-[8rem_minmax(0,1fr)]" style={{ boxShadow: 'var(--shadow-sticker)' }}>
                <GameCover gameId={p.cover} className="h-full min-h-32 border-r-[2.5px] border-border" />
                <span className="p-4 grid gap-1 content-start">
                  <span className="font-display text-xl leading-tight">{p.title}</span>
                  <span className="text-sm font-semibold">{p.summary}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section aria-labelledby="plans" className="grid gap-4">
          <h2 id="plans" className="font-display text-4xl"><Title text={t('hs.plansTitle')} /></h2>
          <div className="grid md:grid-cols-3 gap-4">
            {(['free', 'plus', 'coop'] as const).map((k) => (
              <div key={k} className={`${card} ${k === 'plus' ? '!bg-accent' : ''}`} style={{ boxShadow: 'var(--shadow-sticker)' }}>
                <h3 className="font-display text-2xl">{t(`hs.plan.${k}` as StringKey)}</h3>
                <ul className="grid gap-1.5 list-none p-0 m-0">{[1, 2, 3].map((n) => <li key={n} className="flex gap-2 font-semibold"><Check weight="bold" size={20} className="shrink-0 mt-0.5" aria-hidden="true" />{t(`hs.plan.${k}.${n}` as StringKey)}</li>)}</ul>
                {k === 'coop'
                  ? <Link to="/pricing#schools" className="font-display text-2xl mt-1">{t('hs.plan.coop.price')}</Link>
                  : <p className="font-display text-2xl mt-1">{t(`hs.plan.${k}.price` as StringKey, { m: plus })}</p>}
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="never" className={card} style={{ boxShadow: 'var(--shadow-sticker)' }}>
          <h2 id="never" className="font-display text-3xl flex items-center gap-2"><LockKey weight="fill" size={30} aria-hidden="true" /><Title text={t('hs.neverTitle')} /></h2>
          <ul className="grid sm:grid-cols-2 gap-2 list-none p-0 m-0">{[1, 2, 3, 4].map((n) => <li key={n} className="flex gap-2 font-semibold"><X weight="bold" size={20} className="shrink-0 mt-0.5" aria-hidden="true" />{t(`hs.never.${n}` as StringKey)}</li>)}</ul>
          <Link to="/student-data" className="font-bold">{t('betaPage.promise')}</Link>
        </section>

        <FaqTeaser group="homeschool" />

        <section className="bg-accent border-[2.5px] border-border rounded-panel p-6 grid gap-3 justify-items-center text-center" style={{ boxShadow: 'var(--shadow-sticker-lg)' }}>
          <h2 className="font-display text-4xl"><Title text={t('hs.endTitle')} /></h2>
          <Link to="/login?mode=signup" className={buttonClasses('primary', 'min-h-14 px-7 text-lg hover-pop !bg-text !text-white')}>{t('hs.start')}</Link>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}

export function StudentDataPage() {
  const sections: { key: string; n: number; icon: Icon }[] = [
    { key: 'collect', n: 4, icon: Check }, { key: 'never', n: 5, icon: X }, { key: 'who', n: 3, icon: UsersThree }, { key: 'control', n: 4, icon: ShieldCheck },
  ];
  return (
    <>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 grid gap-6">
        <h1 className="title-bubble text-5xl flex items-center gap-3"><ShieldCheck weight="fill" size={48} aria-hidden="true" className="shrink-0 hidden sm:block" /><Title text={t('data.title')} /></h1>
        <p className="text-xl font-bold max-w-3xl -mt-2">{t('data.sub')}</p>
        {sections.map(({ key, n, icon: I }) => (
          <section key={key} className={card} style={{ boxShadow: 'var(--shadow-sticker)' }}>
            <h2 className="font-display text-3xl"><Title text={t(`data.${key}` as StringKey)} /></h2>
            <ul className="grid gap-2 list-none p-0 m-0">{Array.from({ length: n }, (_, i) => <li key={i} className="flex gap-2 font-semibold text-lg"><I weight="bold" size={22} className="shrink-0 mt-0.5" aria-hidden="true" />{t(`data.${key}.${i + 1}` as StringKey)}</li>)}</ul>
          </section>
        ))}
        <p className="font-semibold">{t('data.more')} <Link to="/privacy" className="font-bold">{t('legal.privacy')}</Link></p>
      </main>
      <PublicFooter />
    </>
  );
}
