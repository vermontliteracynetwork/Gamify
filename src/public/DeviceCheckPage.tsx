import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppWindow, CheckCircle, CornersOut, FloppyDisk, HandPointing, Info, MusicNotes, Play, SpeakerHigh, WarningCircle, WifiHigh, XCircle, type Icon } from '@phosphor-icons/react';
import IconBadge from '../ui/IconBadge';
import { playEffect, speak } from '../engine/feedback';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { useSettings } from '../settings/SettingsContext';
import { Button, buttonClasses } from '../ui/kit';
import Title from '../ui/Title';
import PublicFooter from './PublicFooter';

// "Will Gamify work here?" (Stage 8 device check, for teachers and school
// IT): checks this browser on the spot, nothing is sent anywhere.
type Result = 'ok' | 'warn' | 'fail';
const ICONS: Record<string, Icon> = { browser: AppWindow, screen: CornersOut, storage: FloppyDisk, network: WifiHigh, voice: SpeakerHigh, sound: MusicNotes, touch: HandPointing };
interface Check { id: string; result: Result; detail?: string }

async function runChecks(): Promise<Check[]> {
  const out: Check[] = [];
  const modern = typeof window.structuredClone === 'function' && CSS.supports('display', 'grid') && CSS.supports('aspect-ratio', '1');
  out.push({ id: 'browser', result: modern ? 'ok' : 'fail' });
  const w = window.innerWidth, h = window.innerHeight;
  out.push({ id: 'screen', result: Math.min(w, h) >= 600 ? 'ok' : 'warn', detail: `${w} x ${h}` });
  let storage: Result = 'ok';
  try { localStorage.setItem('gamify:check', '1'); localStorage.removeItem('gamify:check'); } catch { storage = 'fail'; }
  out.push({ id: 'storage', result: storage });
  let net: Result = 'ok';
  try { const r = await fetch(`/favicon.png?check=${Date.now()}`, { cache: 'no-store' }); if (!r.ok) net = 'warn'; } catch { net = 'fail'; }
  out.push({ id: 'network', result: net });
  const voices = typeof speechSynthesis !== 'undefined' ? await new Promise<number>((res) => { const v = speechSynthesis.getVoices(); if (v.length) res(v.length); else { speechSynthesis.onvoiceschanged = () => res(speechSynthesis.getVoices().length); setTimeout(() => res(speechSynthesis.getVoices().length), 1500); } }) : 0;
  out.push({ id: 'voice', result: voices > 0 ? 'ok' : 'warn' });
  out.push({ id: 'sound', result: typeof AudioContext !== 'undefined' || 'webkitAudioContext' in window ? 'ok' : 'warn' });
  out.push({ id: 'touch', result: 'ok', detail: navigator.maxTouchPoints > 0 ? t('check.touchYes') : t('check.touchNo') });
  return out;
}

export default function DeviceCheckPage() {
  const [checks, setChecks] = useState<Check[] | null>(null);
  const { settings } = useSettings();
  useEffect(() => { void runChecks().then(setChecks); }, []);
  const worst: Result = !checks ? 'ok' : checks.some((c) => c.result === 'fail') ? 'fail' : checks.some((c) => c.result === 'warn') ? 'warn' : 'ok';
  const icon = (r: Result, size = 28) => r === 'ok' ? <CheckCircle weight="fill" size={size} color="#1f7a45" aria-hidden="true" /> : r === 'warn' ? <WarningCircle weight="fill" size={size} color="#b7791f" aria-hidden="true" /> : <XCircle weight="fill" size={size} color="#9b2c3a" aria-hidden="true" />;
  const tryIt: Record<string, { label: string; run: () => void } | undefined> = {
    sound: { label: t('check.trySound'), run: () => playEffect('right', settings) },
    voice: { label: t('check.tryVoice'), run: () => speak(t('check.voiceLine'), settings) },
  };
  return (
    <>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-10">
       <div className="max-w-[47.5rem] mx-auto grid gap-5">
        <div className="grid gap-2">
          <h1 className="title-bubble"><Title text={t('check.title')} /></h1>
          <p className="text-lg font-semibold">{t('check.sub')}</p>
        </div>
        {!checks ? <p className="font-bold" role="status">{t('check.running')}</p> : (
          <>
            <section className={`border-bold border-border rounded-panel p-5 flex items-center gap-3 ${worst === 'ok' ? 'bg-mint-soft' : worst === 'warn' ? 'bg-butter' : 'bg-blush'}`} style={{ boxShadow: 'var(--shadow-sticker)' }} role="status">
              {icon(worst, 44)}
              <p className="font-heading font-bold text-2xl">{t(`check.overall.${worst}` as StringKey)}</p>
            </section>
            <ul className="grid gap-3 list-none p-0 m-0">
              {checks.map((c) => {
                const I = ICONS[c.id] ?? Info;
                const extra = tryIt[c.id];
                return (
                  <li key={c.id} className="bg-surface border-std border-border rounded-panel p-4 flex flex-wrap items-center gap-x-4 gap-y-3" style={{ boxShadow: 'var(--shadow-sticker)' }}>
                    <IconBadge color={c.result === 'ok' ? 'mint' : c.result === 'warn' ? 'butter' : 'blush'}><I weight="bold" size={24} /></IconBadge>
                    <span className="grid gap-0.5 flex-1 min-w-[12rem]">
                      <span className="font-bold text-lg">{t(`check.${c.id}` as StringKey)}{c.detail ? `: ${c.detail}` : ''}</span>
                      <span className="font-semibold text-sm text-muted">{t(`check.${c.id}.${c.result}` as StringKey)}</span>
                    </span>
                    {extra && <Button size="sm" onClick={extra.run}><Play weight="fill" size={16} />{extra.label}</Button>}
                    {icon(c.result, 30)}
                  </li>
                );
              })}
            </ul>
            <Link to="/it" className={buttonClasses('secondary', 'justify-self-start')}>{t('public.nav.it')}</Link>
          </>
        )}
        <p className="text-sm font-semibold text-muted">{t('check.private')}</p>
       </div>
      </main>
      <PublicFooter />
    </>
  );
}
