import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChartBar, CreditCard, DeviceMobile, GameController, House, Lightbulb, MagnifyingGlass, PaintBrush, Printer, Question, RocketLaunch, Stack, Student, WifiHigh, Wheelchair, Wrench, type Icon } from '@phosphor-icons/react';
import { GAMES } from '../games/registry';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import Title from '../ui/Title';
import PublicFooter from './PublicFooter';

// Plain information pages for schools: the IT allow-list and help.
function InfoPage({ title, sub, sections, extra }: { title: string; sub: string; sections: { h: StringKey; items: StringKey[] }[]; extra?: React.ReactNode }) {
  return (
    <>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 grid gap-5">
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

// The Help Center (teacher, 2026-11-16: "look more like a professional help
// guide like google help. think blog articles"). A front page with one big
// search and a tile per topic; each topic opens as its own article at
// /help/:topic with numbered steps, a side list of other articles, "Was this
// helpful?" and a way to ask for more help.
const HELP: { h: string; n: number; slug: string; icon: Icon }[] = [
  { h: 'help.start', n: 4, slug: 'getting-started', icon: RocketLaunch }, { h: 'help.students', n: 3, slug: 'students', icon: Student },
  { h: 'help.sets', n: 5, slug: 'question-sets', icon: Stack }, { h: 'help.playing', n: 4, slug: 'playing', icon: GameController },
  { h: 'help.themes', n: 4, slug: 'themes', icon: PaintBrush }, { h: 'help.reports', n: 4, slug: 'reports', icon: ChartBar },
  { h: 'help.supports', n: 3, slug: 'supports', icon: Wheelchair }, { h: 'help.plans', n: 4, slug: 'plans', icon: CreditCard },
  { h: 'help.home', n: 3, slug: 'homeschool', icon: House }, { h: 'help.trouble', n: 3, slug: 'troubleshooting', icon: Wrench },
];
const stepsOf = (g: (typeof HELP)[number]) => Array.from({ length: g.n }, (_, i) => `${g.h}.${i + 1}` as StringKey);

export function HelpPage() {
  const { topic } = useParams();
  const [q, setQ] = useState('');
  const find = q.trim().toLowerCase();
  const host = { host: window.location.host };
  const article = HELP.find((g) => g.slug === topic);
  const hits = find ? HELP.flatMap((g) => stepsOf(g).filter((k) => `${t(g.h as StringKey)} ${t(k, host)}`.toLowerCase().includes(find)).map((k) => ({ g, k }))) : [];
  const card = 'bg-white border-thin border-border-soft rounded-panel';

  if (article) {
    const I = article.icon;
    return (
      <>
        <main className="max-w-6xl mx-auto px-6 sm:px-10 pt-8 pb-16 grid lg:grid-cols-[minmax(0,1fr)_17rem] gap-8 items-start">
          <article className={`${card} p-6 sm:p-10 grid gap-6`}>
            <nav aria-label={t('help.backTo')} className="text-sm font-bold"><Link to="/help" className="text-muted no-underline hover:underline">{t('help.backTo')}</Link><span className="text-faint" aria-hidden="true"> / </span><span>{t(article.h as StringKey)}</span></nav>
            <header className="grid gap-3 border-b-[1.5px] border-border-soft pb-5">
              <span className="w-12 h-12 rounded-full bg-butter border-std border-border grid place-items-center" aria-hidden="true"><I weight="bold" size={24} /></span>
              <h1 className="font-display text-3xl sm:text-4xl leading-tight">{t(article.h as StringKey)}</h1>
              <p className="text-lg text-muted font-semibold leading-relaxed">{t(`${article.h}.desc` as StringKey)}</p>
              <p className="text-xs font-bold text-faint uppercase tracking-wider">{t('help.updated')}</p>
            </header>
            <ol className="grid gap-5 list-none p-0 m-0">
              {stepsOf(article).map((k, i) => (
                <li key={k} className="grid grid-cols-[2.25rem_1fr] gap-3 items-start">
                  <span className="w-9 h-9 rounded-full border-std border-border grid place-items-center font-display font-bold" aria-label={t('help.steps', { n: i + 1 })}>{i + 1}</span>
                  <p className="m-0 text-base leading-relaxed pt-1">{t(k, host)}</p>
                </li>
              ))}
            </ol>
            <Helpful key={article.slug} />
          </article>
          <aside className="grid gap-4 lg:sticky lg:top-16">
            <nav aria-label={t('help.related')} className={`${card} p-5 grid gap-2`}>
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted">{t('help.related')}</h2>
              <ul className="grid gap-1 list-none p-0 m-0">
                {HELP.filter((g) => g !== article).map((g) => <li key={g.slug}><Link to={`/help/${g.slug}`} className="block py-1 text-sm font-bold no-underline text-text hover:underline">{t(g.h as StringKey)}</Link></li>)}
              </ul>
            </nav>
            <StillStuck card={card} />
          </aside>
        </main>
        <PublicFooter />
      </>
    );
  }

  return (
    <>
      <main className="max-w-6xl mx-auto px-6 sm:px-10 pt-8 pb-16 grid gap-8">
        <section className="px-2 pt-4 grid gap-4 justify-items-center text-center">
          <h1 className="font-display text-4xl sm:text-5xl">{t('help.ask')}</h1>
          <label className="relative w-full max-w-2xl">
            <MagnifyingGlass weight="bold" size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('help.search')} aria-label={t('help.search')}
              className="w-full min-h-14 pl-11 pr-4 rounded-pill border-std border-border bg-surface text-lg font-semibold" />
          </label>
          <nav aria-label={t('help.shortcuts')} className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm font-bold">
            {[['/faq', 'public.nav.faq', Question], ['/it', 'public.nav.it', WifiHigh], ['/check', 'public.nav.check', DeviceMobile], ['/beta-kit', 'beta.kit', Printer], ['/blog', 'ways.title', Lightbulb]].map(([to, k, Ic]) => {
              const C = Ic as Icon;
              return <Link key={to as string} to={to as string} className="inline-flex items-center gap-1.5 no-underline text-muted hover:underline pointer-coarse:min-h-11 max-sm:text-base"><C weight="bold" size={16} />{t(k as StringKey)}</Link>;
            })}
          </nav>
        </section>

        {find ? (
          <section className="grid gap-3" aria-live="polite">
            <h2 className="font-display text-2xl">{t('help.results')}</h2>
            {hits.length === 0 ? <p className="font-semibold">{t('help.none')}</p> : (
              <ul className="grid gap-3 list-none p-0 m-0">
                {hits.map(({ g, k }) => (
                  <li key={k}><Link to={`/help/${g.slug}`} className={`${card} block p-4 no-underline text-text hover:border-border`}>
                    <span className="block text-xs font-bold uppercase tracking-wider text-muted">{t(g.h as StringKey)}</span>
                    <span className="block mt-1 leading-relaxed">{t(k, host)}</span>
                  </Link></li>
                ))}
              </ul>
            )}
          </section>
        ) : (
          <>
            <section className="grid gap-4">
              <h2 className="font-display text-2xl">{t('help.topics')}</h2>
              <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 list-none p-0 m-0">
                {HELP.map((g) => {
                  const I = g.icon;
                  return (
                    <li key={g.slug}>
                      <Link to={`/help/${g.slug}`} className={`${card} hover-lift h-full p-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 no-underline text-text`}>
                        <span className="row-span-2 w-11 h-11 rounded-full bg-surface-2 border-thin border-border grid place-items-center" aria-hidden="true"><I weight="bold" size={22} /></span>
                        <span className="font-bold text-lg leading-tight">{t(g.h as StringKey)}</span>
                        <span className="text-sm text-muted font-semibold leading-snug">{t(`${g.h}.desc` as StringKey)}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
            <section className="grid gap-3">
              <h2 className="font-display text-2xl">{t('help.howToPlay')}</h2>
              <ul className="flex flex-wrap gap-2 list-none p-0 m-0">
                {GAMES.map((g) => <li key={g.id}><Link to={`/blog/how-to-play/${g.id}`} className="inline-flex min-h-9 tap items-center px-3 rounded-pill bg-white border-thin border-border-soft font-bold text-sm no-underline text-text hover:border-border">{g.name}</Link></li>)}
              </ul>
            </section>
            <StillStuck card={card} />
          </>
        )}
      </main>
      <PublicFooter />
    </>
  );
}

// "Was this helpful?" at the end of an article: a thank you, nothing stored.
function Helpful() {
  const [said, setSaid] = useState(false);
  return (
    <div className="border-t-[1.5px] border-border-soft pt-5 flex flex-wrap items-center gap-3">
      {said ? <p className="m-0 font-bold" role="status">{t('help.thanks')}</p> : <>
        <p className="m-0 font-bold">{t('help.helpful')}</p>
        <button type="button" onClick={() => setSaid(true)} className="min-h-9 tap px-4 rounded-pill border-thin border-border bg-white font-bold text-sm">{t('help.yes')}</button>
        <button type="button" onClick={() => setSaid(true)} className="min-h-9 tap px-4 rounded-pill border-thin border-border bg-white font-bold text-sm">{t('help.no')}</button>
      </>}
    </div>
  );
}

function StillStuck({ card }: { card: string }) {
  return (
    <section className={`${card} p-5 grid gap-1`}>
      <h2 className="font-bold text-lg">{t('help.stillStuck')}</h2>
      <p className="m-0 text-sm text-muted font-semibold leading-snug">{t('help.stillText')}</p>
    </section>
  );
}
