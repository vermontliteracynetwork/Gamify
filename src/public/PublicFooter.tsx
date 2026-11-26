import { Link } from 'react-router-dom';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';

// The public footer (approved /brand "Top bar and footer", 2026-11-25): the
// logo and the tagline, then three grouped columns (Gamify, For you, Trust)
// and the copyright line. Grouping cuts the scan from 17 loose links to three
// labeled sets (Gestalt common region; Miller-style chunking). The Vermont line
// is waiting on her new words (Waiting on you, footer-tag), so it stays out.
// Attributions (Common Core notice, fonts, software) live on /credits.
const COLS: [StringKey, [string, StringKey][]][] = [
  ['footer.col.gamify', [['/features', 'public.nav.features'], ['/pricing', 'public.nav.pricing'], ['/research', 'research.title'], ['/themes', 'public.nav.themes'], ['/blog', 'public.nav.ideas'], ['/status', 'footer.status']]],
  ['footer.col.you', [['/login', 'footer.teachers'], ['/schools', 'footer.schools'], ['/homeschool', 'public.nav.homeschool'], ['/it', 'public.nav.it'], ['/beta', 'public.nav.beta'], ['/affiliates', 'footer.affiliates']]],
  ['footer.col.trust', [['/student-data', 'public.nav.studentData'], ['/accessibility', 'legal.a11y'], ['/accessibility/report', 'footer.vpat'], ['/privacy', 'legal.privacy'], ['/terms', 'legal.terms'], ['/credits', 'legal.credits'], ['/help', 'public.nav.faq'], ['/faq', 'faq.short']]],
];

export default function PublicFooter() {
  return (
    <footer className="public-footer mt-16 border-t-[2.5px] border-border bg-surface">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 grid gap-8">
        <div className="grid gap-x-4 gap-y-8 grid-cols-2 md:grid-cols-3 lg:grid-cols-[1.3fr_repeat(3,1fr)]">
          <div className="grid gap-3 content-start col-span-2 md:col-span-3 lg:col-span-1">
            <Link to="/" aria-label={t('nav.home')} className="justify-self-start"><img src="/brand/gamify-wordmark.png" alt="Gamify" className="h-8 w-auto" /></Link>
            <p className="m-0 font-semibold text-muted max-w-[22rem]">{t('footer.tagline')}</p>
          </div>
          {COLS.map(([head, links]) => (
            <nav key={head} aria-label={t(head)} className="grid gap-1 content-start">
              <p aria-hidden="true" className="m-0 mb-1 font-heading font-bold text-lg">{t(head)}</p>
              {links.map(([to, key]) => (
                <Link key={to} to={to} className="font-semibold text-base text-text no-underline hover:underline min-h-8 pointer-coarse:min-h-11 inline-flex items-center justify-self-start">{t(key)}</Link>
              ))}
            </nav>
          ))}
        </div>
        <p className="m-0 text-sm font-bold text-muted">{t('legal.copyright', { year: new Date().getFullYear() })}</p>
      </div>
    </footer>
  );
}
