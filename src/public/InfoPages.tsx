import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Buildings, ChalkboardTeacher, ChartBar, CreditCard, DeviceMobile, GameController, House, Lightbulb, MagnifyingGlass, PaintBrush, Printer, RocketLaunch, Stack, Student, WifiHigh, Wheelchair, Wrench, type Icon } from '@phosphor-icons/react';
import { GAMES } from '../games/registry';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import Title from '../ui/Title';
import Accordion from '../ui/Accordion';
import { Button, buttonClasses } from '../ui/kit';
import PublicFooter from './PublicFooter';
import { FAQ_GROUPS, FAQS, type FaqGroup } from './faq';
import { SB_PASTELS, SbDot, SbH2, SbHead, SbMain, SbMore, SbSection, sbCard, sbCardLink, sbPill } from './scrapbookA';


// Plain information pages for schools: the IT allow-list and help.
function InfoPage({ title, sub, sections, extra }: { title: string; sub: string; sections: { h: StringKey; items: StringKey[] }[]; extra?: React.ReactNode }) {
  return (
    <>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 grid gap-5">
        <h1 className="title-bubble text-5xl"><Title text={title} /></h1>
        <p className="text-lg font-bold">{sub}</p>
        {sections.map((s) => (
          <section key={s.h} className="hover-lift bg-surface border-bold border-border rounded-panel p-5 grid gap-2" style={{ boxShadow: 'var(--shadow-sticker)' }}>
            <h2 className="font-display text-3xl"><Title text={t(s.h)} /></h2>
            <ul className="grid gap-2 list-disc pl-5 m-0">{s.items.map((k) => <li key={k} className="font-semibold">{t(k, { host: window.location.host, cloud: CLOUD_HOST })}</li>)}</ul>
          </section>
        ))}
        {extra}
      </main>
      <PublicFooter />
    </>
  );
}

// The cloud address IT needs to allow (saved work and live games).
const CLOUD_HOST = (() => { try { return new URL(import.meta.env.VITE_SUPABASE_URL as string).host; } catch { return 'the Gamify cloud address'; } })();

export function ItPage() {
  return <InfoPage title={t('it.title')} sub={t('it.sub')} sections={[
    { h: 'it.allow', items: ['it.allow.1', 'it.allow.2', 'it.allow.4', 'it.allow.3'] },
    { h: 'it.devices', items: ['it.devices.1', 'it.devices.2', 'it.devices.3', 'it.devices.4'] },
    { h: 'it.privacy', items: ['it.privacy.1', 'it.privacy.2', 'it.privacy.3', 'it.privacy.4'] },
    { h: 'it.rollout', items: ['it.rollout.1', 'it.rollout.2', 'it.rollout.3', 'it.rollout.4'] },
  ]} />;
}


// Help: the how-to guides and the FAQ in one page (owner 2026-11-26: "merge
// faq and help how to to just help in how to a style"), in Scrapbook strength
// A (the "Help!" mockup). One search across every tip and every answer, a
// card per topic (each opens as its own article at /help/:topic with
// numbered steps), then Quick answers for each kind of reader. /faq now
// redirects here, to #faq. Earlier asks kept: a professional help guide with
// articles (teacher, 2026-11-16) and a FAQ search engines can read (2026-10-31).
const HELP: { h: string; n: number; slug: string; icon: Icon }[] = [
  { h: 'help.start', n: 4, slug: 'getting-started', icon: RocketLaunch }, { h: 'help.students', n: 3, slug: 'students', icon: Student },
  { h: 'help.sets', n: 5, slug: 'question-sets', icon: Stack }, { h: 'help.playing', n: 4, slug: 'playing', icon: GameController },
  { h: 'help.themes', n: 4, slug: 'themes', icon: PaintBrush }, { h: 'help.reports', n: 4, slug: 'reports', icon: ChartBar },
  { h: 'help.supports', n: 3, slug: 'supports', icon: Wheelchair }, { h: 'help.plans', n: 4, slug: 'plans', icon: CreditCard },
  { h: 'help.home', n: 3, slug: 'homeschool', icon: House }, { h: 'help.trouble', n: 3, slug: 'troubleshooting', icon: Wrench },
];
const stepsOf = (g: (typeof HELP)[number]) => Array.from({ length: g.n }, (_, i) => `${g.h}.${i + 1}` as StringKey);
const GROUP_ICONS: Record<FaqGroup, Icon> = { teachers: ChalkboardTeacher, schools: Buildings, homeschool: House, students: Student };
const NEXT: Record<FaqGroup, { to: string; label: StringKey; go: boolean }> = {
  teachers: { to: '/login?mode=signup', label: 'public.startFree', go: true },
  schools: { to: '/schools', label: 'faq.next.schools', go: false },
  homeschool: { to: '/homeschool', label: 'faq.next.homeschool', go: false },
  students: { to: '/join', label: 'faq.next.students', go: true },
};
const MORE: [string, StringKey, Icon][] = [['/it', 'public.nav.it', WifiHigh], ['/check', 'public.nav.check', DeviceMobile], ['/beta-kit', 'beta.kit', Printer], ['/blog', 'ways.title', Lightbulb]];
const searchBox = 'w-full min-h-14 pl-12 pr-4 rounded-pill border-[3px] border-border bg-white text-lg font-semibold';
const answers = '!bg-white !border-[3px] shadow-[0_5px_0_var(--ink)]';

export function HelpPage() {
  const { topic } = useParams();
  const [params, setParams] = useSearchParams();
  const group = (FAQ_GROUPS.includes(params.get('for') as FaqGroup) ? params.get('for') : 'teachers') as FaqGroup;
  const [q, setQ] = useState('');
  const find = q.trim().toLowerCase();
  const host = { host: window.location.host };
  const article = HELP.find((g) => g.slug === topic);
  const hits = find ? HELP.flatMap((g) => stepsOf(g).filter((k) => `${t(g.h as StringKey)} ${t(k, host)}`.toLowerCase().includes(find)).map((k) => ({ g, k }))) : [];
  const faqHits = find ? FAQ_GROUPS.flatMap((g) => FAQS[g].filter((f) => `${f.q} ${f.a}`.toLowerCase().includes(find)).map((f) => ({ ...f, g }))) : [];
  // Search engines read the questions as a FAQ (no tracking, just page data).
  useEffect(() => {
    if (article) return;
    const el = document.createElement('script');
    el.type = 'application/ld+json';
    el.text = JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ_GROUPS.flatMap((g) => FAQS[g]).map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) });
    document.head.appendChild(el);
    return () => el.remove();
  }, [article]);
  // A link to /help#faq (or the old /faq) opens at Quick answers.
  useEffect(() => {
    if (article || window.location.hash !== '#faq') return;
    const id = setTimeout(() => document.getElementById('faq')?.scrollIntoView(), 60);
    return () => clearTimeout(id);
  }, [article]);

  if (article) {
    return (
      <>
        <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 grid lg:grid-cols-[minmax(0,1fr)_17.5rem] gap-8 items-start">
          <article className="grid gap-5 max-w-[47.5rem]">
            <nav aria-label={t('help.backTo')} className="text-base font-bold text-muted"><Link to="/help" className="text-muted no-underline hover:underline">{t('help.backTo')}</Link><span aria-hidden="true"> / </span><span>{t(article.h as StringKey)}</span></nav>
            <SbHead title={t(article.h as StringKey)} sub={t(`${article.h}.desc` as StringKey)}>
              <p className="m-0 text-sm font-semibold text-muted">{t('help.updated')}</p>
            </SbHead>
            <ol className="grid gap-3 list-none p-0 m-0">
              {stepsOf(article).map((k, i) => (
                <li key={k} className={`${sbCard} p-4 sm:p-5 flex items-start gap-4`}>
                  <span className="w-10 h-10 shrink-0 rounded-full bg-butter border-bold border-border grid place-items-center font-score text-xl" aria-label={t('help.steps', { n: i + 1 })}>{i + 1}</span>
                  <p className="m-0 text-lg font-semibold leading-relaxed pt-1">{t(k, host)}</p>
                </li>
              ))}
            </ol>
            <Helpful key={article.slug} />
          </article>
          <aside className="grid gap-4 lg:sticky lg:top-24">
            <nav aria-label={t('help.related')} className={`${sbCard} p-5 grid gap-2`}>
              <h2 className="m-0 font-heading font-bold text-lg">{t('help.related')}</h2>
              <ul className="grid gap-1 list-none p-0 m-0">
                {HELP.filter((g) => g !== article).map((g) => <li key={g.slug}><Link to={`/help/${g.slug}`} className="block py-1 font-bold underline underline-offset-4 text-text pointer-coarse:min-h-11 pointer-coarse:flex pointer-coarse:items-center">{t(g.h as StringKey)}</Link></li>)}
              </ul>
            </nav>
            <StillStuck />
          </aside>
        </main>
        <PublicFooter />
      </>
    );
  }

  return (
    <>
      <SbMain className="!gap-10 sm:!gap-12">
        <SbHead title={t('help.pageTitle')} sub={t('help.pageSub')}>
          <label className="relative w-full">
            <MagnifyingGlass weight="bold" size={22} className="absolute left-4 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('help.search')} aria-label={t('help.search')} className={searchBox} />
          </label>
        </SbHead>

        {find ? (
          <section className="grid gap-6" aria-live="polite">
            <SbH2>{t('help.results')}</SbH2>
            {hits.length === 0 && faqHits.length === 0 && <p className="m-0 font-semibold text-lg">{t('help.none')}</p>}
            {hits.length > 0 && (
              <ul className="grid gap-3 list-none p-0 m-0">
                {hits.map(({ g, k }) => (
                  <li key={k}><Link to={`/help/${g.slug}`} className={`${sbCardLink} block p-4`}>
                    <span className="block text-sm font-bold uppercase tracking-wider text-muted">{t(g.h as StringKey)}</span>
                    <span className="block mt-1 text-lg font-semibold leading-relaxed">{t(k, host)}</span>
                  </Link></li>
                ))}
              </ul>
            )}
            {faqHits.length > 0 && <>
              <h3 className="m-0 font-heading font-bold text-xl sm:text-2xl">{faqHits.length === 1 ? t('faq.found.one') : t('faq.found', { count: faqHits.length })}</h3>
              <Accordion className={answers} items={faqHits.map((f) => ({
                id: `${f.g}-${f.q}`, title: f.q, body: <p>{f.a}</p>,
                tag: <span className="text-sm font-bold px-2 py-0.5 rounded-pill border-std border-border whitespace-nowrap">{t(`faq.group.${f.g}` as StringKey)}</span>,
              }))} />
            </>}
          </section>
        ) : (
          <>
            <SbSection label="help-topics">
              <SbH2 id="help-topics">{t('help.topics')}</SbH2>
              <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-[1.375rem] list-none p-0 m-0">
                {HELP.map((g, i) => {
                  const I = g.icon;
                  return (
                    <li key={g.slug}>
                      <Link to={`/help/${g.slug}`} className={`${sbCardLink} h-full p-5 flex gap-3 items-start`}>
                        <SbDot bg={SB_PASTELS[i % SB_PASTELS.length]}><I weight="bold" size={24} /></SbDot>
                        <span className="grid gap-1">
                          <span className="font-heading font-bold text-xl sm:text-[1.4375rem] leading-tight">{t(g.h as StringKey)}</span>
                          <span className="font-semibold text-base sm:text-lg leading-snug">{t(`${g.h}.desc` as StringKey)}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </SbSection>

            <SbSection label="faq" className="scroll-mt-24">
              <div id="faq" className="grid gap-3 scroll-mt-24">
                <SbH2 id="faq-title">{t('faq.short')}</SbH2>
                <p className="m-0 text-lg sm:text-[1.375rem] font-semibold leading-snug">{t('help.faqSub')}</p>
              </div>
              <div role="tablist" aria-label={t('faq.tabs')} className="flex flex-wrap gap-2.5">
                {FAQ_GROUPS.map((g) => {
                  const I = GROUP_ICONS[g];
                  return (
                    <button key={g} type="button" role="tab" aria-selected={g === group} onClick={() => setParams({ for: g }, { replace: true, preventScrollReset: true })} className={sbPill(g === group)}>
                      <I weight={g === group ? 'fill' : 'bold'} size={20} aria-hidden="true" />{t(`faq.group.${g}` as StringKey)}
                    </button>
                  );
                })}
              </div>
              <div role="tabpanel" aria-label={t(`faq.group.${group}` as StringKey)} className="grid gap-4">
                <Accordion className={answers} items={FAQS[group].map((f) => ({ id: `${group}-${f.q}`, title: f.q, body: <p>{f.a}</p> }))} />
                {/* One next step for this reader; "Still need help?" closes the page. */}
                <Link to={NEXT[group].to} className={buttonClasses(NEXT[group].go ? 'go' : 'main', 'justify-self-start hover-pop min-h-12 px-6')}>{t(NEXT[group].label)}</Link>
              </div>
            </SbSection>

            <SbSection label="help-play">
              <SbH2 id="help-play">{t('help.howToPlay')}</SbH2>
              <ul className="flex flex-wrap gap-2.5 list-none p-0 m-0">
                {GAMES.map((g) => <li key={g.id}><Link to={`/blog/how-to-play/${g.id}`} className={`${sbPill(false)} no-underline text-text`}>{g.name}</Link></li>)}
              </ul>
            </SbSection>

            <nav aria-label={t('help.shortcuts')} className="grid gap-4">
              <h2 className="m-0 font-heading font-bold text-xl sm:text-[1.4375rem]">{t('help.shortcuts')}</h2>
              <ul className="flex flex-wrap gap-x-6 gap-y-3 list-none p-0 m-0">
                {MORE.map(([to, k, I]) => <li key={to}><Link to={to} className="inline-flex items-center gap-2 text-text pointer-coarse:min-h-11"><I weight="bold" size={20} aria-hidden="true" /><SbMore>{t(k)}</SbMore></Link></li>)}
              </ul>
            </nav>
            <StillStuck />
          </>
        )}
      </SbMain>
      <PublicFooter />
    </>
  );
}

// "Was this helpful?" at the end of an article: a thank you, nothing stored.
function Helpful() {
  const [said, setSaid] = useState(false);
  return (
    <div className={`${sbCard} !bg-lavender p-4 flex flex-wrap items-center gap-3`}>
      {said ? <p className="m-0 font-bold" role="status">{t('help.thanks')}</p> : <>
        <p className="m-0 font-bold text-lg">{t('help.helpful')}</p>
        <Button size="sm" onClick={() => setSaid(true)}>{t('help.yes')}</Button>
        <Button size="sm" onClick={() => setSaid(true)}>{t('help.no')}</Button>
      </>}
    </div>
  );
}

function StillStuck() {
  return (
    <section className={`${sbCard} !bg-butter p-5 sm:p-6 grid gap-1`}>
      <h2 className="m-0 font-heading font-bold text-xl sm:text-[1.4375rem]">{t('help.stillStuck')}</h2>
      <p className="m-0 font-semibold text-lg leading-snug">{t('help.stillText')}</p>
    </section>
  );
}
