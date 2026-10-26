import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BookOpen, Buildings, CaretDown, ChalkboardTeacher, DeviceMobile, House, Lightbulb, MagnifyingGlass, Student, WifiHigh } from '@phosphor-icons/react';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { buttonClasses } from '../ui/kit';
import PublicFooter from './PublicFooter';
import { FAQ_GROUPS, FAQS, type FaqGroup } from './faq';

const ICONS = { teachers: ChalkboardTeacher, schools: Buildings, homeschool: House, students: Student } as const;
const NEXT: Record<FaqGroup, { to: string; label: StringKey }> = {
  teachers: { to: '/login?mode=signup', label: 'public.startFree' },
  schools: { to: '/schools', label: 'faq.next.schools' },
  homeschool: { to: '/homeschool', label: 'faq.next.homeschool' },
  students: { to: '/join', label: 'faq.next.students' },
};
const LINKS = [
  { to: '/help', icon: BookOpen, key: 'guides' },
  { to: '/it', icon: WifiHigh, key: 'it' },
  { to: '/check', icon: DeviceMobile, key: 'check' },
  { to: '/blog', icon: Lightbulb, key: 'blog' },
] as const;

// The Help Center (teacher, 2026-10-26: "a more professional looking help
// page"): one search across every answer, topics down the side, answers in
// one clean list, and links to the how-to guides, IT and device pages.
export default function FaqPage() {
  const [params, setParams] = useSearchParams();
  const group = (FAQ_GROUPS.includes(params.get('for') as FaqGroup) ? params.get('for') : 'teachers') as FaqGroup;
  const [search, setSearch] = useState('');
  const q = search.trim().toLowerCase();
  const hits = q ? FAQ_GROUPS.flatMap((g) => FAQS[g].filter((f) => `${f.q} ${f.a}`.toLowerCase().includes(q)).map((f) => ({ ...f, g }))) : FAQS[group].map((f) => ({ ...f, g: group }));
  // Search engines read the questions as a FAQ (no tracking, just page data).
  useEffect(() => {
    const el = document.createElement('script');
    el.type = 'application/ld+json';
    el.text = JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ_GROUPS.flatMap((g) => FAQS[g]).map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) });
    document.head.appendChild(el);
    return () => el.remove();
  }, []);
  const panel = 'bg-surface border-[2px] border-border rounded-panel';
  return (
    <>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 grid gap-6">
        <header className={`${panel} p-6 sm:p-8 grid gap-3`}>
          <p className="text-sm font-bold uppercase tracking-wider text-muted">{t('help.kicker')}</p>
          <h1 className="font-display text-4xl sm:text-5xl">{t('help.ask')}</h1>
          <p className="text-lg font-semibold max-w-3xl">{t('faq.sub')}</p>
          <label className="relative max-w-3xl">
            <MagnifyingGlass weight="bold" size={22} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('faq.search')} aria-label={t('faq.search')}
              className="w-full min-h-14 pl-12 pr-4 rounded-input border-[2px] border-border bg-surface-2 font-semibold text-lg" />
          </label>
        </header>

        <nav aria-label={t('help.shortcuts')} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {LINKS.map(({ to, icon: I, key }) => (
            <Link key={key} to={to} className={`${panel} p-4 no-underline text-text flex items-start gap-3 hover:bg-surface-hover`}>
              <I weight="bold" size={26} className="shrink-0" aria-hidden="true" />
              <span className="grid gap-0.5"><span className="font-bold">{t(`help.links.${key}` as StringKey)}</span><span className="text-sm font-semibold text-muted">{t(`help.links.${key}Text` as StringKey)}</span></span>
            </Link>
          ))}
        </nav>

        <div className="grid md:grid-cols-[16rem_minmax(0,1fr)] gap-6 items-start">
          <aside className={`${panel} p-2 md:sticky md:top-24`}>
            <p className="px-3 pt-2 pb-1 text-xs font-bold uppercase tracking-wider text-muted">{t('help.topics')}</p>
            <div role="tablist" aria-label={t('faq.tabs')} aria-orientation="vertical" className="grid gap-1">
              {FAQ_GROUPS.map((g) => {
                const I = ICONS[g];
                const on = !q && g === group;
                return (
                  <button key={g} type="button" role="tab" aria-selected={on} onClick={() => { setSearch(''); setParams({ for: g }, { replace: true }); }}
                    className={`min-h-12 px-3 rounded-input font-bold text-left flex items-center gap-2 ${on ? 'bg-accent' : 'hover:bg-surface-2'}`}>
                    <I weight={on ? 'fill' : 'bold'} size={20} aria-hidden="true" />{t(`faq.group.${g}` as StringKey)}
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="grid gap-3" aria-live="polite">
            <h2 className="font-display text-3xl">{q ? t('faq.found', { count: hits.length }) : t(`faq.group.${group}` as StringKey)}</h2>
            <div className={`${panel} divide-y-[1.5px] divide-border-soft`}>
              {hits.map((f) => (
                <details key={`${f.g}-${f.q}`} className="group px-5 py-4">
                  <summary className="cursor-pointer flex items-start gap-3 list-none font-bold text-lg">
                    <span className="flex-1">{f.q}</span>
                    {q && <span className="text-xs font-bold px-2 py-0.5 rounded-pill border-[1.5px] border-border-soft whitespace-nowrap">{t(`faq.group.${f.g}` as StringKey)}</span>}
                    <CaretDown weight="bold" size={20} className="shrink-0 mt-1 motion-safe:transition-transform group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <p className="font-semibold leading-relaxed mt-2 mb-0 text-text/90">{f.a}</p>
                </details>
              ))}
            </div>
            <div className={`${panel} p-5 grid gap-3 sm:grid-cols-[1fr_auto] items-center mt-2`}>
              <div>
                <h3 className="font-bold text-xl">{t('faq.moreTitle')}</h3>
                <p className="font-semibold text-muted">{t('faq.more')}</p>
              </div>
              <Link to={NEXT[group].to} className={buttonClasses('primary', 'min-h-12 px-6')}>{t(NEXT[group].label)}</Link>
            </div>
          </section>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
