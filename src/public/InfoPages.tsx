import { Link } from 'react-router-dom';
import { Printer } from '@phosphor-icons/react';
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
  ]} />;
}

export function HelpPage() {
  return <InfoPage title={t('help.title')} sub={t('help.sub')} sections={[
    { h: 'help.start', items: ['help.start.1', 'help.start.2', 'help.start.3', 'help.start.4'] },
    { h: 'help.students', items: ['help.students.1', 'help.students.2', 'help.students.3'] },
    { h: 'help.supports', items: ['help.supports.1', 'help.supports.2', 'help.supports.3'] },
    { h: 'help.trouble', items: ['help.trouble.1', 'help.trouble.2', 'help.trouble.3'] },
  ]} extra={<Link to="/beta-kit" className={buttonClasses('secondary', 'justify-self-start hover-pop')}><Printer weight="bold" size={18} />{t('help.betaKit')}</Link>} />;
}
