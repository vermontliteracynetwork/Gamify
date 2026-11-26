import { Link } from 'react-router-dom';
import { BookOpen, Buildings, ChalkboardTeacher, ChartBar, Check, FileText, HandTap, Heart, LockKey, Minus, Rocket, ShieldCheck, Sparkle, Stack, UsersThree, Wrench, X } from '@phosphor-icons/react';
import { PRICES_USD_PER_YEAR, SCHOOL_SEAT_DISCOUNTS, perMonthUSD } from '../config';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { buttonClasses } from '../ui/kit';
import Title from '../ui/Title';
import PublicFooter from './PublicFooter';
import Accordion from '../ui/Accordion';
import { POSTS } from './posts';
import { FAQS } from './faq';
import { BlogCard, PostHeader } from './BlogCard';
import { SB_PASTELS, SbDot, SbH2, SbH3, SbHead, SbMain, SbMore, SbSection, sbCard, sbCardLink } from './scrapbookA';
import { useScrapbookGround } from './scrapbook/Shell';

// Pages for each buyer (teacher, 2026-10-25): schools and districts, and
// homeschool families, plus the student data promise both ask about. Value
// first, the free start always visible, the price framed per teacher or per
// month, and every committee question answered with a link. Schools and
// Homeschool wear Scrapbook strength A (owner 2026-11-26: "schools =a",
// "homeschool=a"): white cards with the ink outline on cream, Grow Year
// section titles, one pastel badge per card, no tape, tilt or stickers.
const card = 'bg-surface border-bold border-border rounded-panel p-5 grid gap-2 content-start';
type Icon = typeof Rocket;

// Two-column cards, a badge beside each title (the mockup's Why and Fit cards).
function Pillars({ items, icons = true }: { items: { icon: Icon; key: string }[]; icons?: boolean }) {
  return (
    <div className="grid sm:grid-cols-2 gap-4 sm:gap-[1.375rem]">
      {items.map(({ icon: I, key }, i) => (
        <article key={key} className={`${sbCard} p-6 grid gap-2 content-start`}>
          <span className="flex items-center gap-3">{icons && <SbDot bg={SB_PASTELS[i % 4]}><I weight="bold" size={24} /></SbDot>}<SbH3>{t(key as StringKey)}</SbH3></span>
          <p className="m-0 font-semibold text-lg leading-snug">{t(`${key}.text` as StringKey)}</p>
        </article>
      ))}
    </div>
  );
}

// The first five questions for this buyer, folded, then a link to every answer
// on the Help page (the FAQ lives there now, owner 2026-11-26).
function FaqTeaser({ group }: { group: 'schools' | 'homeschool' }) {
  return (
    <SbSection label="faq-teaser">
      <SbH2 id="faq-teaser">{t('aud.faqTitle')}</SbH2>
      <Accordion className="!bg-white !border-[3px] shadow-[0_5px_0_var(--ink)]" items={FAQS[group].slice(0, 5).map((f) => ({ id: f.q, title: f.q, body: <p>{f.a}</p> }))} />
      <Link to={`/help?for=${group}#faq`} className={buttonClasses('secondary', 'justify-self-start hover-pop')}>{t('aud.allQuestions')}</Link>
    </SbSection>
  );
}

const buttons = 'flex flex-col sm:flex-row sm:flex-wrap gap-3 w-full sm:w-auto';

export function SchoolsPage() {
  useScrapbookGround(); // owner 2026-11-26: this page is scrapbook A
  const committee: [Icon, string, string][] = [[ShieldCheck, 'privacy', '/student-data'], [Stack, 'dpa', '/help?for=schools#faq'], [HandTap, 'a11y', '/accessibility'], [Wrench, 'it', '/it'], [ChartBar, 'research', '/research'], [Buildings, 'price', '/pricing#schools']];
  return (
    <>
      <SbMain>
        <SbHead title={t('schools.title')} sub={t('schools.sub')}>
          <div className={buttons}>
            <Link to="/pricing#schools" className={buttonClasses('main', 'hover-pop', 'lg')}>{t('schools.quote')}</Link>
            <Link to="/beta" className={buttonClasses('secondary', 'hover-pop', 'lg')}>{t('schools.pilot')}</Link>
          </div>
        </SbHead>

        <SbSection label="why">
          <SbH2 id="why">{t('schools.whyTitle')}</SbH2>
          <Pillars items={[{ icon: BookOpen, key: 'schools.p1' }, { icon: Heart, key: 'schools.p2' }, { icon: ShieldCheck, key: 'schools.p3' }, { icon: Rocket, key: 'schools.p4' }]} />
        </SbSection>

        <SbSection label="committee">
          <div className="grid gap-3">
            <SbH2 id="committee">{t('schools.committeeTitle')}</SbH2>
            <p className="m-0 text-lg sm:text-[1.375rem] font-semibold leading-snug">{t('schools.committeeSub')}</p>
          </div>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-[1.375rem] list-none p-0 m-0">
            {committee.map(([I, k, to], i) => (
              <li key={k}><Link to={to} className={`${sbCardLink} h-full p-5 grid gap-2 content-start`}>
                <span className="flex items-center gap-3"><SbDot bg={SB_PASTELS[[0, 1, 2, 3, 4, 5][i]]} size="sm"><I weight="bold" size={22} /></SbDot><SbH3>{t(`schools.c.${k}` as StringKey)}</SbH3></span>
                <span className="font-semibold text-lg leading-snug">{t(`schools.c.${k}.text` as StringKey)}</span>
                <SbMore>{t(`schools.c.${k}` as StringKey)}</SbMore>
              </Link></li>
            ))}
          </ul>
        </SbSection>

        <SbSection label="rollout">
          <SbH2 id="rollout">{t('schools.rolloutTitle')}</SbH2>
          <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-[1.375rem] list-none p-0 m-0">
            {[1, 2, 3, 4].map((n) => (
              <li key={n} className={`${sbCard} p-5 grid gap-2 content-start`}>
                <span className="justify-self-start px-3 py-1 rounded-pill bg-butter border-std border-border font-bold text-base">{t('help.steps', { n })}</span>
                <SbH3>{t(`schools.step.${n}` as StringKey)}</SbH3>
                <p className="m-0 font-semibold text-lg leading-snug">{t(`schools.step.${n}.text` as StringKey)}</p>
              </li>
            ))}
          </ol>
        </SbSection>

        <SbSection label="value">
          <div className="grid gap-3">
            <SbH2 id="value">{t('schools.valueTitle')}</SbH2>
            <p className="m-0 text-lg sm:text-[1.375rem] font-semibold leading-snug">{t('schools.valueSub')}</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 sm:gap-[1.375rem]">
            {SCHOOL_SEAT_DISCOUNTS.slice().reverse().map((d) => (
              <div key={d.minSeats} className={`${sbCard} p-5 grid gap-1 content-start text-center justify-items-center ${d.minSeats === 10 ? '!bg-butter' : ''}`}>
                <p className="m-0 font-bold text-lg">{t('schools.tierTeachers', { n: d.minSeats })}</p>
                <p className="m-0 font-score text-[2.5rem] leading-none">{t('schools.save', { off: Math.round(d.discount * 100) })}</p>
                <p className="m-0 font-semibold">{t('schools.quoteByEmail')}</p>
              </div>
            ))}
          </div>
          <p className="m-0 font-semibold text-muted">{t('schools.po')}</p>
        </SbSection>

        <FaqTeaser group="schools" />

        <section className={`${sbCard} !bg-mint p-6 sm:p-8 grid gap-3 justify-items-start`}>
          <SbH2>{t('schools.endTitle')}</SbH2>
          <p className="m-0 text-lg sm:text-[1.375rem] font-semibold leading-snug">{t('schools.endText')}</p>
          <div className={buttons}>
            <Link to="/pricing#schools" className={buttonClasses('main', 'hover-pop', 'lg')}>{t('schools.quote')}</Link>
            <Link to="/login?mode=signup" className={buttonClasses('go', 'hover-pop', 'lg')}>{t('public.startFree')}</Link>
          </div>
        </section>
      </SbMain>
      <PublicFooter />
    </>
  );
}

// Three homeschool blog posts on the Homeschool page (owner 2026-11-26: "show
// 3 homeschool posts on the blog with an arrow under that says view all
// blog"). Siblings, records and co-op day: the three homeschool-tagged posts
// beside the week-of-games post, which repeats the "five different days"
// section she removed from this page.
const HS_POSTS = ['siblings-different-grades-one-game', 'game-time-into-homeschool-records', 'co-op-game-day'];

export function HomeschoolPage() {
  useScrapbookGround(); // owner 2026-11-26: this page is scrapbook A
  const home = perMonthUSD(PRICES_USD_PER_YEAR.homeschool);
  const posts = HS_POSTS.map((slug) => ({ p: POSTS.find((x) => x.slug === slug)!, i: POSTS.findIndex((x) => x.slug === slug) })).filter((x) => x.p);
  return (
    <>
      <SbMain>
        <SbHead title={t('hs.title')} sub={t('hs.sub')}>
          <div className={buttons}>
            <Link to="/login?mode=signup" className={buttonClasses('go', 'hover-pop', 'lg')}><ChalkboardTeacher weight="bold" size={22} />{t('hs.start')}</Link>
            <Link to="/help?for=homeschool#faq" className={buttonClasses('secondary', 'hover-pop', 'lg')}>{t('hs.questions')}</Link>
          </div>
        </SbHead>

        <SbSection label="fit">
          <SbH2 id="fit">{t('hs.fitTitle')}</SbH2>
          <Pillars icons={false} items={[{ icon: UsersThree, key: 'hs.p1' }, { icon: Sparkle, key: 'hs.p2' }, { icon: Heart, key: 'hs.p3' }, { icon: FileText, key: 'hs.p4' }]} />
        </SbSection>

        {/* The "one question set, five different days" week is gone (owner 2026-11-26: "remove"). */}
        <SbSection label="hs-posts">
          <div className="grid gap-3">
            <SbH2 id="hs-posts">{t('hs.postsTitle')}</SbH2>
            <p className="m-0 text-lg sm:text-[1.375rem] font-semibold leading-snug">{t('hs.postsSub')}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-[1.375rem]">
            {posts.map(({ p, i }) => <BlogCard key={p.slug} to={`/blog/${p.slug}`} header={<PostHeader i={i} />} title={p.title} sub={p.summary} />)}
          </div>
          <Link to="/blog" className="justify-self-start text-text"><SbMore>{t('hs.postsAll')}</SbMore></Link>
        </SbSection>

        <SbSection label="plans">
          <SbH2 id="plans">{t('hs.plansTitle')}</SbH2>
          {/* Free and the Homeschool plan (teacher, 2026-10-26: no Plus or co-op cards here). */}
          <div className="grid md:grid-cols-2 gap-4 sm:gap-[1.375rem] items-start">
            {(['free', 'homeschool'] as const).map((k) => (
              <div key={k} className={`${sbCard} p-6 grid gap-3 content-start ${k === 'homeschool' ? '!bg-butter' : ''}`}>
                <h3 className="title-bubble m-0 text-[1.875rem] leading-none"><Title text={t(`hs.plan.${k}` as StringKey)} /></h3>
                <ul className="grid gap-1.5 list-none p-0 m-0">{(k === 'free' ? [1, 2, 3] : [1, 2, 3, 4, 5, 6, 7, 8]).map((n) => <li key={n} className="flex gap-2 font-semibold text-base sm:text-[1.0625rem] leading-snug"><Check weight="bold" size={20} className="shrink-0 mt-0.5 text-success-ink" aria-hidden="true" />{t(`hs.plan.${k}.${n}` as StringKey)}</li>)}</ul>
                <p className="m-0 font-bold text-lg">{t(`hs.plan.${k}.price` as StringKey, { m: home })}</p>
                {k === 'homeschool' && <Link to="/login?mode=signup&plan=homeschool" className={buttonClasses('go', 'justify-self-start min-h-12 px-6 hover-pop')}>{t('hs.plan.homeschool.start')}</Link>}
              </div>
            ))}
          </div>
          <section aria-labelledby="never" className={`${sbCard} p-6 grid gap-3`}>
            <h3 id="never" className="m-0 font-heading font-bold text-xl sm:text-[1.4375rem] flex items-center gap-2"><LockKey weight="fill" size={26} aria-hidden="true" />{t('hs.neverTitle')}</h3>
            <ul className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 list-none p-0 m-0">{[1, 2, 3, 4].map((n) => <li key={n} className="flex gap-2 items-start font-bold text-base sm:text-[1.0625rem]"><Minus weight="bold" size={18} className="shrink-0 mt-1" aria-hidden="true" />{t(`hs.never.${n}` as StringKey)}</li>)}</ul>
            <Link to="/student-data" className="font-bold justify-self-start">{t('betaPage.promise')}</Link>
          </section>
        </SbSection>

        <FaqTeaser group="homeschool" />

        <section className={`${sbCard} !bg-mint p-6 sm:p-8 grid gap-4 justify-items-start`}>
          <SbH2>{t('hs.endTitle')}</SbH2>
          <Link to="/login?mode=signup" className={buttonClasses('go', 'hover-pop', 'lg')}>{t('hs.start')}</Link>
        </section>
      </SbMain>
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
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 grid gap-6">
        <h1 className="title-bubble text-5xl"><Title text={t('data.title')} /></h1>
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
