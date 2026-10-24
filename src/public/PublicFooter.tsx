import { Link } from 'react-router-dom';
import { t } from '../i18n';

export default function PublicFooter() {
  return (
    <footer className="mt-16 border-t-[2.5px] border-border bg-surface">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid gap-4 sm:grid-cols-[1fr_auto] items-start">
        <div className="grid gap-2">
          <img src="/brand/gamify-wordmark.png" alt="Gamify" className="h-8 w-auto justify-self-start" />
          <p className="text-sm font-bold text-muted max-w-md">{t('public.footerPromise')}</p>
          <p className="text-xs text-muted max-w-xl">{t('public.ccss')}</p>
        </div>
        <nav aria-label={t('public.footerNav')} className="flex flex-wrap gap-x-5 gap-y-2 font-bold text-sm">
          <Link to="/features">{t('public.nav.features')}</Link>
          <Link to="/pricing">{t('public.nav.pricing')}</Link>
          <Link to="/join">{t('public.nav.join')}</Link>
          <Link to="/help">{t('public.nav.help')}</Link>
          <Link to="/it">{t('public.nav.it')}</Link>
          <Link to="/login">{t('public.nav.login')}</Link>
        </nav>
      </div>
    </footer>
  );
}
