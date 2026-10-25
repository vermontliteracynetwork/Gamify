import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lightbulb, MagnifyingGlass, Printer, Question, WifiHigh } from '@phosphor-icons/react';
import { buttonClasses } from '../ui/kit';
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
          <section key={s.h} className="hover-lift bg-surface border-[2.5px] border-border rounded-panel p-5 grid gap-2" style={{ boxShadow: 'var(--shadow-sticker)' }}>
            <h2 className="font-display text-3xl"><Title text={t(s.h)} /></h2>
            <ul className="grid gap-2 list-disc pl-5 m-0">{s.items.map((k) => <li key={k} className="font-semibold">{t(k, { host: window.location.host })}</li>)}</ul>
          </section>
        ))}
        {extra}
      </main>
      <PublicFooter />
    </>
  );
}

export function ItPage() {
  return <InfoPage title={t('it.title')} sub={t('it.sub')} sections={[
    { h: 'it.allow', items: ['it.allow.1', 'it.allow.2', 'it.allow.3'] },
    { h: 'it.devices', items: ['it.devices.1', 'it.devices.2', 'it.devices.3', 'it.devices.4'] },
    { h: 'it.privacy', items: ['it.privacy.1', 'it.privacy.2', 'it.privacy.3', 'it.privacy.4'] },
    { h: 'it.rollout', items: ['it.rollout.1', 'it.rollout.2', 'it.rollout.3', 'it.rollout.4'] },
  ]} />;
}

// The help center (teacher, 2026-10-25: every page at its fullest): every
// how-to, grouped and searchable, with links to questions, IT and the kit.
const HELP: { h: string; n: number }[] = [
  { h: 'help.start', n: 4 }, { h: 'help.students', n: 3 }, { h: 'help.sets', n: 5 }, { h: 'help.playing', n: 4 },
  { h: 'help.themes', n: 4 }, { h: 'help.reports', n: 3 }, { h: 'help.supports', n: 3 }, { h: 'help.plans', n: 4 },
  { h: 'help.home', n: 3 }, { h: 'help.trouble', n: 3 },
];

export function HelpPage() {
  const [q, setQ] = useState('');
  const find = q.trim().toLowerCase();
  const host = { host: window.location.host };
  const groups = HELP.map((g) => ({ ...g, items: Array.from({ length: g.n }, (_, i) => `${g.h}.${i + 1}` as StringKey).filter((k) => !find || `${t(g.h as StringKey)} ${t(k, host)}`.toLowerCase().includes(find)) })).filter((g) => g.items.length);
  return (
    <>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 grid gap-5">
        <h1 className="title-bubble text-5xl"><Title text={t('help.title')} /></h1>
        <p className="text-lg font-bold -mt-2">{t('help.sub')}</p>
        <label className="relative">
          <MagnifyingGlass weight="bold" size={22} className="absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('help.search')} aria-label={t('help.search')} className="w-full min-h-14 pl-11 pr-3 rounded-input border-[2.5px] border-border bg-surface font-bold text-lg" />
        </label>
        <nav aria-label={t('help.shortcuts')} className="flex flex-wrap gap-2">
          <Link to="/faq" className={buttonClasses('secondary', 'hover-pop')}><Question weight="bold" size={18} />{t('public.nav.faq')}</Link>
          <Link to="/it" className={buttonClasses('secondary', 'hover-pop')}><WifiHigh weight="bold" size={18} />{t('public.nav.it')}</Link>
          <Link to="/beta-kit" className={buttonClasses('secondary', 'hover-pop')}><Printer weight="bold" size={18} />{t('beta.kit')}</Link>
          <Link to="/ways" className={buttonClasses('secondary', 'hover-pop')}><Lightbulb weight="bold" size={18} />{t('ways.title')}</Link>
        </nav>
        {find && <p className="font-bold" role="status">{groups.length ? t('help.found', { count: groups.reduce((n, g) => n + g.items.length, 0) }) : t('help.none')}</p>}
        <div className="grid md:grid-cols-2 gap-4 items-start">
          {groups.map((g) => (
            <section key={g.h} className="bg-surface border-[2.5px] border-border rounded-panel p-5 grid gap-2" style={{ boxShadow: 'var(--shadow-sticker)' }}>
              <h2 className="font-display text-2xl"><Title text={t(g.h as StringKey)} /></h2>
              <ul className="grid gap-2 list-disc pl-5 m-0">{g.items.map((k) => <li key={k} className="font-semibold">{t(k, host)}</li>)}</ul>
            </section>
          ))}
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
