import { Link } from 'react-router-dom';
import { t } from '../i18n';

// The public footer: site links, legal links and the copyright line.
// Attributions (Common Core notice, fonts, software) live on /credits.
export default function PublicFooter() {
  return (
    <footer className="mt-16 border-t-[2.5px] border-border bg-surface">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid gap-5 lg:grid-cols-[minmax(12rem,auto)_minmax(0,1fr)] items-start">
        <img src="/brand/gamify-wordmark.png" alt="Gamify" className="h-8 w-auto justify-self-start" />
        <nav aria-label={t('public.footerNav')} className="flex flex-wrap gap-x-5 gap-y-2 font-bold text-sm">
          <Link to="/features">{t('public.nav.features')}</Link>
          <Link to="/pricing">{t('public.nav.pricing')}</Link>
          <Link to="/themes">{t('public.nav.themes')}</Link>
          <Link to="/schools">{t('public.nav.schools')}</Link>
          <Link to="/homeschool">{t('public.nav.homeschool')}</Link>
          <Link to="/blog">{t('public.nav.ideas')}</Link>
          <Link to="/research">{t('research.title')}</Link>
          <Link to="/faq">{t('public.nav.faq')}</Link>
          <Link to="/beta">{t('public.nav.beta')}</Link>
        </nav>
        <p className="text-sm font-bold text-muted">{t('legal.copyright', { year: new Date().getFullYear() })}</p>
        <nav aria-label={t('legal.footerNav')} className="flex flex-wrap gap-x-5 gap-y-2 font-semibold text-sm">
          <Link to="/privacy">{t('legal.privacy')}</Link>
          <Link to="/student-data">{t('public.nav.studentData')}</Link>
          <Link to="/terms">{t('legal.terms')}</Link>
          <Link to="/accessibility">{t('legal.a11y')}</Link>
          <Link to="/credits">{t('legal.credits')}</Link>
        </nav>
      </div>
    </footer>
  );
}
