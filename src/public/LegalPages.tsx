import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import Title from '../ui/Title';
import PublicFooter from './PublicFooter';

// The legal pages the footer links to. Privacy and Terms carry the short,
// factual promise until the attorney-approved documents are posted
// (development plan Stage 8; drafts in docs/legal). Credits holds the
// attributions licenses ask for (Common Core notice, fonts, icons, libraries).
// The approved /brand Legal template (2026-11-25): an "On this page" list
// (a sticky card beside the text on laptops, a card on top on phones and
// iPads) so a parent or district reviewer jumps straight to the part they
// came for (NN/g: in-page links for long reference pages), an Updated line,
// and plain headed sections in one reading column.
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
function LegalPage({ title, intro, sections }: { title: string; intro: string; sections: { h: string; items: string[] }[] }) {
  return (
    <>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 grid gap-6 items-start">
        {/* No On this page box (owner, 2026-11-27: "remove the on this page directory"). */}
        <article className="grid gap-6 max-w-[47.5rem] min-w-0">
          <div className="grid gap-2">
            <h1 className="title-bubble text-5xl"><Title text={title} /></h1>
            <p className="m-0 font-semibold text-muted">{t('legal.updated', { date: LEGAL_UPDATED })}</p>
          </div>
          <p className="m-0 text-lg font-bold">{intro}</p>
          {sections.map((s) => (
            <section key={s.h} id={slug(s.h)} className="grid gap-2 scroll-mt-24">
              <h2 className="m-0 font-heading font-bold text-2xl">{s.h}</h2>
              <ul className="grid gap-2 list-disc pl-5 m-0">{s.items.map((k) => <li key={k} className="font-semibold leading-relaxed">{k}</li>)}</ul>
            </section>
          ))}
        </article>
      </main>
      <PublicFooter />
    </>
  );
}
// The month these pages last changed; move it with every edit to their words.
const LEGAL_UPDATED = 'November 2026';
const keys = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => t(`${prefix}.${i + 1}` as StringKey));

export function PrivacyPage() {
  return <LegalPage title={t('legal.privacy')} intro={t('legal.privacyIntro')} sections={[
    { h: t('legal.privacyPromise'), items: keys('legal.privacyPromise', 7) },
    { h: t('legal.privacyFull'), items: keys('legal.privacyFull', 1) },
  ]} />;
}

export function TermsPage() {
  return <LegalPage title={t('legal.terms')} intro={t('legal.termsIntro')} sections={[
    { h: t('legal.termsShort'), items: keys('legal.termsShort', 4) },
    { h: t('legal.termsFull'), items: keys('legal.termsFull', 1) },
  ]} />;
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
    { h: t('legal.creditsArt'), items: keys('legal.creditsArt', 6) },
    { h: t('legal.creditsCode'), items: keys('legal.creditsCode', 5) },
    { h: t('legal.creditsTrademarks'), items: keys('legal.creditsTrademarks', 1) },
  ]} />;
}
