import { Link } from 'react-router-dom';
import { Check } from '@phosphor-icons/react';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { buttonClasses } from '../ui/kit';
import Title from '../ui/Title';
import PublicFooter from './PublicFooter';

// Every feature, grouped the way teachers think about them.
const GROUPS: { key: string; items: number }[] = [
  { key: 'play', items: 5 }, { key: 'sets', items: 5 }, { key: 'classes', items: 5 },
  { key: 'supports', items: 6 }, { key: 'themes', items: 4 }, { key: 'safety', items: 5 },
];

export default function FeaturesPage() {
  return (
    <>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-10">
        <h1 className="title-bubble text-5xl mb-3"><Title text={t('features.title')} /></h1>
        <p className="text-lg font-bold mb-8 max-w-2xl">{t('features.sub')}</p>
        <div className="grid md:grid-cols-2 gap-5">
          {GROUPS.map((g) => (
            <section key={g.key} className="bg-surface border-[2.5px] border-border rounded-panel p-5 grid gap-3 content-start" style={{ boxShadow: 'var(--shadow-sticker)' }}>
              <h2 className="font-display text-3xl"><Title text={t(`features.${g.key}` as StringKey)} /></h2>
              <ul className="grid gap-2 list-none p-0 m-0">
                {Array.from({ length: g.items }, (_, i) => (
                  <li key={i} className="flex gap-2 font-semibold"><Check weight="bold" size={20} className="shrink-0 mt-0.5" aria-hidden="true" />{t(`features.${g.key}.${i + 1}` as StringKey)}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 mt-8">
          <Link to="/login?mode=signup" className={buttonClasses('primary', 'min-h-14 px-7 text-lg')}>{t('public.startFree')}</Link>
          <Link to="/pricing" className={buttonClasses('secondary', 'min-h-14 px-7 text-lg')}>{t('public.seePlans')}</Link>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
