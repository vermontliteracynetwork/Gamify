import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { t } from '../i18n';
import { CONTACT, DPA, LEGAL_UPDATED, PRIVACY, SUBPROCESSORS, TERMS, type LegalSection } from './legalText';
import type { StringKey } from '../i18n/en';
import Title from '../ui/Title';
import PublicFooter from './PublicFooter';

// The legal pages the footer links to. Privacy and Terms carry the short,
// factual promise until the attorney-approved documents are posted
// (development plan Stage 8; drafts in docs/legal). Credits holds the
// attributions licenses ask for (Common Core notice, fonts, icons, libraries).
function LegalPage({ title, intro, sections }: { title: string; intro: string; sections: { h: string; items: string[] }[] }) {
  return (
    <>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 grid gap-5">
        <h1 className="title-bubble text-5xl"><Title text={title} /></h1>
        <p className="text-lg font-bold">{intro}</p>
        {sections.map((s) => (
          <section key={s.h} className="bg-surface border-bold border-border rounded-panel p-5 grid gap-2" style={{ boxShadow: 'var(--shadow-sticker)' }}>
            <h2 className="font-display text-3xl"><Title text={s.h} /></h2>
            <ul className="grid gap-2 list-disc pl-5 m-0">{s.items.map((k) => <li key={k} className="font-semibold">{k}</li>)}</ul>
          </section>
        ))}
      </main>
      <PublicFooter />
    </>
  );
}
const keys = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => t(`${prefix}.${i + 1}` as StringKey));

// A full legal document in plain words (legal pass, 2026-11-21).
function LegalDoc({ title, intro, sections, children }: { title: string; intro: string; sections: LegalSection[]; children?: ReactNode }) {
  return (
    <>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 grid gap-5">
        <h1 className="title-bubble text-5xl"><Title text={title} /></h1>
        <p className="text-lg font-bold">{intro}</p>
        <p className="text-sm font-bold text-muted">{t('legal.updated', { date: LEGAL_UPDATED })}</p>
        <div className="bg-surface border-bold border-border rounded-panel p-5 sm:p-7 grid gap-6" style={{ boxShadow: 'var(--shadow-sticker)' }}>
          {sections.map((s, i) => (
            <section key={s.h} className="grid gap-2">
              <h2 className="font-heading text-2xl font-bold">{i + 1}. {s.h}</h2>
              {s.p?.map((x) => <p key={x} className="font-semibold leading-relaxed">{x}</p>)}
              {s.items && <ul className="grid gap-1.5 list-disc pl-5 m-0">{s.items.map((x) => <li key={x} className="font-semibold leading-relaxed">{x}</li>)}</ul>}
            </section>
          ))}
          {children}
        </div>
      </main>
      <PublicFooter />
    </>
  );
}

export function PrivacyPage() {
  return (
    <LegalDoc title={t('legal.privacy')} intro={t('legal.privacyIntro')} sections={PRIVACY}>
      <p className="font-semibold"><Link to="/subprocessors" className="font-bold underline">{t('legal.subprocessors')}</Link> · <Link to="/dpa" className="font-bold underline">{t('legal.dpa')}</Link> · <Link to="/student-data" className="font-bold underline">{t('legal.studentData')}</Link></p>
    </LegalDoc>
  );
}

export function TermsPage() {
  return <LegalDoc title={t('legal.terms')} intro={t('legal.termsIntro')} sections={TERMS} />;
}

export function SubprocessorsPage() {
  return (
    <LegalDoc title={t('legal.subprocessors')} intro={t('legal.subprocessorsIntro')} sections={[]}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead><tr className="border-b-[2.5px] border-border">{[t('legal.sp.name'), t('legal.sp.does'), t('legal.sp.gets')].map((h) => <th key={h} scope="col" className="py-2 pr-4 font-heading font-bold">{h}</th>)}</tr></thead>
          <tbody>{SUBPROCESSORS.map((x) => <tr key={x.name} className="border-b border-border-soft align-top"><th scope="row" className="py-3 pr-4 font-bold">{x.name}</th><td className="py-3 pr-4 font-semibold">{x.does}</td><td className="py-3 font-semibold">{x.gets}</td></tr>)}</tbody>
        </table>
      </div>
      <p className="font-semibold">{t('legal.subprocessorsNotice', { email: CONTACT })}</p>
    </LegalDoc>
  );
}

export function DpaPage() {
  return <LegalDoc title={t('legal.dpa')} intro={t('legal.dpaIntro')} sections={DPA} />;
}

export function AccessibilityPage() {
  return <LegalPage title={t('legal.a11y')} intro={t('legal.a11yIntro')} sections={[
    { h: t('legal.a11yBuilt'), items: keys('legal.a11yBuilt', 5) },
    { h: t('legal.a11yTested'), items: keys('legal.a11yTested', 3) },
    { h: t('legal.a11yContact'), items: keys('legal.a11yContact', 1) },
  ]} />;
}

export function CreditsPage() {
  return <LegalPage title={t('legal.credits')} intro={t('legal.creditsIntro')} sections={[
    { h: t('legal.creditsStandards'), items: keys('legal.creditsStandards', 2) },
    { h: t('legal.creditsFonts'), items: keys('legal.creditsFonts', 2) },
    { h: t('legal.creditsArt'), items: keys('legal.creditsArt', 5) },
    { h: t('legal.creditsCode'), items: keys('legal.creditsCode', 5) },
    { h: t('legal.creditsTrademarks'), items: keys('legal.creditsTrademarks', 1) },
  ]} />;
}
