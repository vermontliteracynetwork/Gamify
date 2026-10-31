import { Check } from '@phosphor-icons/react';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';

// Every highlight of a paid plan (teacher, 2026-10-31: "make sure that all
// highlight features in plans are listed for the paid plans on the public
// facing pages"): the four headline lines, then everything else it includes.
const MORE = { plus: 8, pro: 6 } as const;

export default function PlanFeatures({ plan }: { plan: 'plus' | 'pro' }) {
  const item = (key: string, strong = false) => (
    <li key={key} className={`flex gap-2 ${strong ? 'font-bold' : 'font-semibold'}`}><Check weight="bold" size={20} className="shrink-0 mt-0.5" aria-hidden="true" />{t(key as StringKey)}</li>
  );
  return (
    <>
      <ul className="grid gap-2 list-none p-0 m-0">{[1, 2, 3, 4].map((n) => item(`upgrade.${plan}.${n}`, true))}</ul>
      <p className="text-xs font-bold uppercase tracking-wider mt-1 mb-0">{t('plans.alsoTitle')}</p>
      <ul className="grid gap-1.5 list-none p-0 m-0 text-[0.95rem]">{Array.from({ length: MORE[plan] }, (_, i) => item(`plans.${plan}.more.${i + 1}`))}</ul>
    </>
  );
}
