import { useEffect, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { Check, Sparkle, X } from '@phosphor-icons/react';
import { PRICES_USD_PER_YEAR } from '../config';
import { useTier } from '../data/hooks';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { useSettings } from '../settings/SettingsContext';
import { buttonClasses, Panel } from '../ui/kit';
import Title from '../ui/Title';
import { upgradeTo } from './upgrade';
import DialogFocus from '../ui/DialogFocus';

type Plan = 'plus' | 'pro';

// The plan choice, one tap from any limit. Teacher pages only, never on a
// student page.
export function UpgradeDialog({ suggest = 'plus', onClose }: { suggest?: Plan; onClose: () => void }) {
  const { settings } = useSettings();
  const [done, setDone] = useState<Plan | null>(null);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35" role="dialog" aria-modal="true" aria-labelledby="upgrade-title">
      <DialogFocus onClose={onClose} />
      <motion.div initial={settings.motion === 'still' ? false : { scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-2xl bg-surface border-[2.5px] border-border rounded-panel p-5 grid gap-4 overflow-y-auto" style={{ boxShadow: 'var(--shadow-sticker-lg)', maxHeight: 'calc(100dvh - 2rem)' }}>
        <div className="flex items-start gap-2">
          <h2 id="upgrade-title" className="font-display text-3xl flex-1"><Title text={done ? t('upgrade.done', { plan: t(`pricing.${done}` as StringKey) }) : t('upgrade.title')} /></h2>
          <button type="button" aria-label={t('upgrade.close')} onClick={onClose} className="w-11 h-11 rounded-full border-[2px] border-border bg-surface-2 flex items-center justify-center"><X weight="bold" size={18} /></button>
        </div>
        {done ? (
          <div className="grid gap-3">
            <p className="text-lg font-bold">{t('upgrade.doneText')}</p>
            <p className="text-sm font-semibold text-muted">{t('upgrade.testMode')}</p>
            <button type="button" onClick={onClose} className={buttonClasses('primary', 'justify-self-start min-h-14 px-8 text-lg hover-pop')}>{t('upgrade.keepGoing')}</button>
          </div>
        ) : (
          <PlanCards suggest={suggest} onDone={setDone} />
        )}
      </motion.div>
    </div>
  );
}

// The plan cards with their one-tap upgrade buttons, in the upgrade box and
// on the Account page (teacher, 2026-10-26: make upgrading really easy there).
export function PlanCards({ suggest = 'plus', onDone }: { suggest?: Plan; onDone: (plan: Plan) => void }) {
  const { settings } = useSettings();
  const tier = useTier();
  async function go(plan: Plan) {
    await upgradeTo(plan);
    onDone(plan);
    if (settings.celebrations !== 'off' && settings.motion !== 'still') void confetti({ particleCount: 80, spread: 80, origin: { y: 0.5 }, disableForReducedMotion: true });
  }
  const plans: Plan[] = ['plus', 'pro'];
  return (
          <div className="grid sm:grid-cols-2 gap-3">
            {plans.map((p) => (
              <div key={p} className={`rounded-panel border-[2.5px] border-border p-4 grid gap-3 content-start ${p === suggest ? 'bg-accent' : 'bg-surface'}`}>
                <p className="font-display text-2xl flex items-center gap-2">{t(`pricing.${p}` as StringKey)}{p === suggest && <span className="text-xs font-bold bg-surface border-[2px] border-border rounded-pill px-2 py-0.5">{t('upgrade.best')}</span>}</p>
                <div><p className="font-display text-5xl leading-none">{t('upgrade.price', { m: (PRICES_USD_PER_YEAR[p] / 12).toFixed(0) })}</p><p className="font-display text-xl">{t('upgrade.perMonth')}</p><p className="text-sm font-semibold text-muted">{t('upgrade.billed', { n: PRICES_USD_PER_YEAR[p] })}</p></div>
                <ul className="grid gap-1 list-none p-0 m-0">{[1, 2, 3, 4].map((n) => <li key={n} className="flex gap-1.5 font-semibold text-sm"><Check weight="bold" size={18} className="shrink-0" aria-hidden="true" />{t(`upgrade.${p}.${n}` as StringKey)}</li>)}</ul>
                <button type="button" disabled={tier === p || (tier === 'pro' && p === 'plus')} onClick={() => void go(p)}
                  className={buttonClasses('primary', `min-h-14 text-lg hover-pop ${p === suggest ? '!bg-text !text-white' : ''}`)}>{tier === p ? t('upgrade.current') : t('upgrade.go', { plan: t(`pricing.${p}` as StringKey) })}</button>
              </div>
            ))}
            <p className="text-sm font-semibold text-muted sm:col-span-2">{t('upgrade.cancelAnytime')}</p>
          </div>
  );
}

// One dialog for the whole app, so it stays open (with its thank-you) even
// when the limit that opened it goes away the moment the plan changes.
const OPEN_EVENT = 'gamify-upgrade-open';
export function openUpgrade(suggest: Plan) {
  window.dispatchEvent(new CustomEvent<Plan>(OPEN_EVENT, { detail: suggest }));
}

export function UpgradeHost() {
  const [suggest, setSuggest] = useState<Plan | null>(null);
  useEffect(() => {
    const on = (e: Event) => setSuggest((e as CustomEvent<Plan>).detail);
    window.addEventListener(OPEN_EVENT, on);
    return () => window.removeEventListener(OPEN_EVENT, on);
  }, []);
  return suggest ? <UpgradeDialog suggest={suggest} onClose={() => setSuggest(null)} /> : null;
}

export function UpgradeButton({ suggest = 'plus', className = '', label }: { suggest?: Plan; className?: string; label?: string }) {
  const tier = useTier();
  if (tier === 'pro') return null;
  return (
    <button type="button" onClick={() => openUpgrade(tier === 'plus' ? 'pro' : suggest)} className={buttonClasses('primary', `hover-pop ${className}`)} style={{ boxShadow: 'var(--shadow-sticker)' }}>
      <Sparkle weight="fill" size={18} aria-hidden="true" />{label ?? t('upgrade.button')}
    </button>
  );
}

// A plan limit note with the Upgrade button right beside it.
export function LimitNote({ children, suggest = 'plus', className = '' }: { children: ReactNode; suggest?: Plan; className?: string }) {
  return (
    <Panel className={`bg-surface-2 flex flex-wrap items-center gap-3 ${className}`}>
      <p className="font-bold flex-1 min-w-48">{children}</p>
      <UpgradeButton suggest={suggest} />
    </Panel>
  );
}
