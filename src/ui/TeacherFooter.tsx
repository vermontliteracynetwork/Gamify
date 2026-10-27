import { Link } from 'react-router-dom';
import { t } from '../i18n';

// A slim footer on every teacher page (teacher, 2026-10-26): help, ideas and
// the legal pages, one line on wide screens. Not on the live big screen.
export default function TeacherFooter() {
  return (
    <footer id="teacher-footer" className="no-print border-t-[2.5px] border-border bg-surface">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm">
        <nav aria-label={t('teacherFooter.nav')} className="flex flex-wrap gap-x-4 gap-y-1.5 font-bold">
          <Link to="/faq">{t('public.nav.faq')}</Link>
          <Link to="/blog">{t('public.nav.ideas')}</Link>
          <Link to="/check">{t('teacherFooter.check')}</Link>
          <Link to="/pricing">{t('public.nav.pricing')}</Link>
        </nav>
        <nav aria-label={t('legal.footerNav')} className="flex flex-wrap gap-x-4 gap-y-1.5 font-semibold">
          <Link to="/privacy">{t('legal.privacy')}</Link>
          <Link to="/student-data">{t('public.nav.studentData')}</Link>
          <Link to="/terms">{t('legal.terms')}</Link>
          <Link to="/accessibility">{t('legal.a11y')}</Link>
          <Link to="/credits">{t('legal.credits')}</Link>
        </nav>
        <p className="font-bold text-muted sm:ml-auto">{t('legal.copyright', { year: new Date().getFullYear() })}</p>
      </div>
    </footer>
  );
}
