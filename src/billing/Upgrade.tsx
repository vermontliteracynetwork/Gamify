import { useEffect, useState, type ReactNode } from 'react';
import confetti from 'canvas-confetti';
import { Check, Sparkle } from '@phosphor-icons/react';
import { LAUNCH_OFFER, PRICES_USD_PER_YEAR, perMonthUSD } from '../config';
import { usePlan, useTierLoaded } from '../data/hooks';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { useSettings } from '../settings/SettingsContext';
import { buttonClasses, Panel } from '../ui/kit';
import { upgradeTo } from './upgrade';
import Dialog from '../ui/Dialog';

type Plan = 'plus' | 'pro';

// The plan choice, one tap from any limit. Teacher pages only, never on a
// student page.
export function UpgradeDialog({ suggest = 'plus', onClose }: { suggest?: Plan; onClose: () => void }) {
  const [done, setDone] = useState<Plan | null>(null);
  return (
    <Dialog size="lg" title={done ? t('upgrade.done', { plan: t(`pricing.${done}` as StringKey) }) : t('upgrade.title')} onClose={onClose} closeLabel={t('upgrade.close')}>
        {done ? (
          <div className="grid gap-3">
            <p className="text-lg font-bold">{t('upgrade.doneText')}</p>
            <p className="text-sm font-semibold text-muted">{t('upgrade.testMode')}</p>
            <button type="button" onClick={onClose} className={buttonClasses('primary', 'justify-self-start hover-pop', 'lg')}>{t('upgrade.keepGoing')}</button>
          </div>
        ) : (
          <PlanCards suggest={suggest} onDone={setDone} />
        )}
    </Dialog>
  );
}

// The plan cards with their one-tap upgrade buttons, in the upgrade box and
// on the Account page (teacher, 2026-10-26: make upgrading really easy there).
export function PlanCards({ suggest = 'plus', onDone }: { suggest?: Plan; onDone: (plan: Plan) => void }) {
  const { settings } = useSettings();
  // The saved plan, not the trial: during the Plus trial, Get Plus still
  // works (it keeps Plus after the trial).
  const plan = usePlan();
  const tier = plan?.real ?? 'free';
  // During the trial, every Get button says when billing starts.
  const inTrial = tier === 'free' && !!plan?.trial?.active;
  async function go(plan: Plan) {
    await upgradeTo(plan);
    onDone(plan);
    if (settings.celebrations !== 'off' && settings.motion !== 'still') void confetti({ particleCount: 80, spread: 80, origin: { y: 0.5 }, disableForReducedMotion: true });
  }
  const plans: Plan[] = ['plus', 'pro'];
  return (
          <div className="grid sm:grid-cols-2 gap-3">
            {plans.map((p) => {
              // The suggested card wears Grape, as on the welcome screen (Design Chair, 2026-11-26).
              const bright = p === suggest;
              const muted = bright ? 'text-white' : 'text-muted';
              const off = tier === p || (tier === 'pro' && p === 'plus');
              return (
              <div key={p} className={`rounded-panel border-bold border-border p-4 grid gap-3 content-start ${bright ? 'bg-grape text-white' : 'bg-surface'}`} style={bright ? { boxShadow: 'var(--shadow-sticker)' } : undefined}>
                {/* No "Best fit" label: the brighter card is the hint (owner removed "Recommended" on Pricing, 2026-11-26). */}
                <p className="font-display text-2xl">{t(`pricing.${p}` as StringKey)}</p>
                {/* Every price carries its renewal line (marketing, 2026-11-26; ROSCA clear terms). */}
                <div><p className="font-display text-5xl leading-none">{t('upgrade.price', { m: perMonthUSD(PRICES_USD_PER_YEAR[p]) })}</p><p className="font-display text-xl">{t('upgrade.perMonth')}</p><p className={`text-sm font-semibold ${muted}`}>{t('pricing.renews.year', { n: PRICES_USD_PER_YEAR[p].toFixed(2).replace(/\.00$/, '') })}</p></div>
                <ul className="grid gap-1 list-none p-0 m-0">{[1, 2, 3, 4].map((n) => <li key={n} className="flex gap-1.5 font-semibold text-sm"><Check weight="bold" size={18} className="shrink-0" aria-hidden="true" />{t(`upgrade.${p}.${n}` as StringKey)}</li>)}</ul>
                <div className="grid gap-1">
                  <button type="button" disabled={off} onClick={() => void go(p)}
                    className={bright ? 'min-h-14 rounded-pill border-std border-border bg-white text-grape-deep font-bold text-lg inline-flex items-center justify-center gap-2 shadow-[0_3px_0_var(--ink)] hover:bg-surface-hover hover-pop disabled:opacity-60' : buttonClasses('main', 'min-h-14 !text-lg hover-pop')}>{tier === p ? t('upgrade.current') : t('upgrade.go', { plan: t(`pricing.${p}` as StringKey) })}</button>
                  {inTrial && !off && <p className={`m-0 text-sm font-semibold text-center ${muted}`}>{t('welcome.billingNote')}</p>}
                </div>
              </div>
              );
            })}
            {saleOn() && <p className="text-sm font-semibold sm:col-span-2 m-0">{t('pricing.founding', { name: LAUNCH_OFFER.name, off: Math.round(LAUNCH_OFFER.discount * 100) })}</p>}
            <p className="text-sm font-semibold text-muted sm:col-span-2">{t('upgrade.cancelAnytime')}</p>
          </div>
  );
}

// The launch sale line shows only while the sale is real (no fake timers).
export const saleOn = (now = Date.now()) => LAUNCH_OFFER.active && now < Date.parse(`${LAUNCH_OFFER.endsBefore}T00:00:00-05:00`);

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

// Only on Free (owner, 2026-11-27: "for plans that are already upgraded, dont
// show upgrade banenrs"), and never while the plan is still loading.
export function UpgradeButton({ suggest = 'plus', className = '', label }: { suggest?: Plan; className?: string; label?: string }) {
  const tier = useTierLoaded();
  if (tier !== 'free') return null;
  return (
    <button type="button" onClick={() => openUpgrade(suggest)} className={buttonClasses('main', `hover-pop ${className}`)} style={{ boxShadow: 'var(--shadow-sticker)' }}>
      <Sparkle weight="fill" size={18} aria-hidden="true" />{label ?? t('upgrade.button')}
    </button>
  );
}

// A plan limit note with the Upgrade button right beside it.
// On a paid plan the limit still shows, as a plain line with no upgrade.
export function LimitNote({ children, suggest = 'plus', className = '' }: { children: ReactNode; suggest?: Plan; className?: string }) {
  const tier = useTierLoaded();
  if (tier === null) return null;
  if (tier !== 'free') return <p className={`font-bold text-sm text-muted ${className}`}>{children}</p>;
  return (
    <Panel className={`bg-surface-2 flex flex-wrap items-center gap-3 ${className}`}>
      <p className="font-bold flex-1 min-w-48">{children}</p>
      <UpgradeButton suggest={suggest} />
    </Panel>
  );
}
