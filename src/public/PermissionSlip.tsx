import { Printer } from '@phosphor-icons/react';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { Button } from '../ui/kit';
import Title from '../ui/Title';

// The parent or guardian permission slip for hand-drawn challenge entries
// (teacher, 2026-10-26: "handdrawn (permission needed)"). One page, printed
// and sent home; the teacher keeps the signed slips. A draft until the
// attorney reviews it with the official rules.
export default function PermissionSlip() {
  const line = 'border-b-[2px] border-border min-h-10';
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-16 grid gap-5 print:pt-0">
      <div className="no-print flex flex-wrap items-center gap-3">
        <Button variant="primary" onClick={() => window.print()}><Printer weight="bold" size={18} />{t('permission.print')}</Button>
        <p className="text-sm font-bold text-muted">{t('permission.draft')}</p>
      </div>
      <article className="bg-surface border-[2.5px] border-border rounded-panel p-6 sm:p-8 grid gap-4 print:border-0 print:p-0">
        <img src="/brand/gamify-wordmark.png" alt="Gamify" className="h-8 w-auto justify-self-start" />
        <h1 className="font-display text-3xl"><Title text={t('permission.title')} /></h1>
        <p className="text-lg font-semibold">{t('permission.intro')}</p>
        <h2 className="font-display text-2xl">{t('permission.what')}</h2>
        <ul className="grid gap-2 pl-6 m-0 list-disc font-semibold">{[1, 2, 3, 4].map((n) => <li key={n}>{t(`permission.${n}` as StringKey)}</li>)}</ul>
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4 pt-2">
          {(['child', 'teacher', 'guardian', 'date'] as const).map((k) => (
            <div key={k} className="grid gap-1"><span className="font-bold text-sm">{t(`permission.${k}`)}</span><span className={line} /></div>
          ))}
          <div className="grid gap-1 sm:col-span-2"><span className="font-bold text-sm">{t('permission.show')}</span>
            <span className="flex gap-6 font-semibold"><span>☐ {t('permission.yes')}</span><span>☐ {t('permission.no')}</span></span>
          </div>
          <div className="grid gap-1 sm:col-span-2"><span className="font-bold text-sm">{t('permission.sign')}</span><span className={`${line} min-h-14`} /></div>
        </div>
        <p className="text-xs font-semibold text-muted">{t('permission.draft')}</p>
      </article>
    </main>
  );
}
