import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Buildings, CaretDown, ChalkboardTeacher, House, MagnifyingGlass, Student } from '@phosphor-icons/react';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { buttonClasses, Tabs } from '../ui/kit';
import Title from '../ui/Title';
import PublicFooter from './PublicFooter';
import { FAQ_GROUPS, FAQS, type FaqGroup } from './faq';

const ICONS = { teachers: ChalkboardTeacher, schools: Buildings, homeschool: House, students: Student } as const;
const NEXT: Record<FaqGroup, { to: string; label: StringKey }> = {
  teachers: { to: '/login?mode=signup', label: 'public.startFree' },
  schools: { to: '/schools', label: 'faq.next.schools' },
  homeschool: { to: '/homeschool', label: 'faq.next.homeschool' },
  students: { to: '/join', label: 'faq.next.students' },
};

// Questions teachers, schools, homeschool families and students ask, with a
// search across all of them (teacher, 2026-10-25).
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
  const Icon = ICONS[group];
  return (
    <>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 grid gap-5">
        <h1 className="title-bubble text-5xl"><Title text={t('faq.title')} /></h1>
        <p className="text-xl font-bold max-w-3xl -mt-2">{t('faq.sub')}</p>
        <label className="relative">
          <MagnifyingGlass weight="bold" size={22} className="absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('faq.search')} aria-label={t('faq.search')}
            className="w-full min-h-14 pl-11 pr-3 rounded-input border-[2.5px] border-border bg-surface font-bold text-lg" />
        </label>
        {!q && <Tabs label={t('faq.tabs')} value={group} onChange={(v) => setParams({ for: v }, { replace: true })} options={FAQ_GROUPS.map((g) => ({ id: g, label: t(`faq.group.${g}` as StringKey) }))} />}
        {!q && <h2 className="font-display text-3xl flex items-center gap-2"><Icon weight="fill" size={32} aria-hidden="true" /><Title text={t(`faq.group.${group}` as StringKey)} /></h2>}
        {q && <p className="font-bold" role="status">{t('faq.found', { count: hits.length })}</p>}
        <div className="grid gap-3">
          {hits.map((f) => (
            <details key={`${f.g}-${f.q}`} className="group bg-surface border-[2px] border-border rounded-input p-4" style={{ boxShadow: 'var(--shadow-sticker)' }}>
              <summary className="font-display text-xl cursor-pointer flex items-start gap-2 list-none">
                <CaretDown weight="bold" size={22} className="shrink-0 mt-1 motion-safe:transition-transform group-open:rotate-180" aria-hidden="true" />
                <span className="flex-1">{f.q}</span>
                {q && <span className="text-xs font-bold px-2 py-0.5 rounded-pill border-[2px] border-border-soft font-body">{t(`faq.group.${f.g}` as StringKey)}</span>}
              </summary>
              <p className="font-semibold text-lg leading-relaxed mt-3 mb-0 pl-8">{f.a}</p>
            </details>
          ))}
        </div>
        <section className="bg-accent border-[2.5px] border-border rounded-panel p-5 grid gap-3 sm:grid-cols-[1fr_auto] items-center" style={{ boxShadow: 'var(--shadow-sticker)' }}>
          <div>
            <h2 className="font-display text-2xl"><Title text={t('faq.moreTitle')} /></h2>
            <p className="font-semibold">{t('faq.more')}</p>
          </div>
          <Link to={NEXT[group].to} className={buttonClasses('primary', 'min-h-14 px-7 text-lg hover-pop !bg-text !text-white')}>{t(NEXT[group].label)}</Link>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
