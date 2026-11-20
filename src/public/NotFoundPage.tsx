import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { House, Keyhole, Question } from '@phosphor-icons/react';
import { t } from '../i18n';
import { buttonClasses } from '../ui/kit';
import Title from '../ui/Title';

// Gamify's own "page not found" (site QA, 2026-11-20): a friendly line and
// the three places people usually meant to go.
export default function NotFoundPage() {
  useEffect(() => { const id = window.setTimeout(() => { document.title = 'Page not found | Gamify'; }, 0); return () => window.clearTimeout(id); }, []);
  return (
    <main className="max-w-2xl mx-auto px-4 pt-16 pb-24 grid gap-5 justify-items-center text-center">
      <p className="font-display text-8xl leading-none" aria-hidden="true">404</p>
      <h1 className="title-bubble text-4xl"><Title text={t('notFound.title')} /></h1>
      <p className="text-lg font-bold">{t('notFound.text')}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link to="/" className={buttonClasses('primary', 'hover-pop')}><House weight="bold" size={18} />{t('notFound.home')}</Link>
        <Link to="/join" className={buttonClasses('secondary', 'hover-pop')}><Keyhole weight="bold" size={18} />{t('notFound.join')}</Link>
        <Link to="/faq" className={buttonClasses('secondary', 'hover-pop')}><Question weight="bold" size={18} />{t('notFound.help')}</Link>
      </div>
    </main>
  );
}
