import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, SpeakerHigh, WarningCircle, XCircle } from '@phosphor-icons/react';
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
  return (
    <>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 grid gap-5">
        <h1 className="title-bubble text-5xl"><Title text={t('check.title')} /></h1>
        <p className="text-lg font-bold -mt-2">{t('check.sub')}</p>
        {!checks ? <p className="font-bold" role="status">{t('check.running')}</p> : (
          <>
            <section className={`border-[2.5px] border-border rounded-panel p-5 flex items-center gap-3 ${worst === 'ok' ? 'bg-[#d9f5d0]' : worst === 'warn' ? 'bg-accent' : 'bg-[#ffd9cf]'}`} style={{ boxShadow: 'var(--shadow-sticker)' }} role="status">
              {icon(worst, 44)}
              <p className="font-display text-2xl">{t(`check.overall.${worst}` as StringKey)}</p>
            </section>
            <ul className="grid gap-2 list-none p-0 m-0">
              {checks.map((c) => (
                <li key={c.id} className="bg-surface border-[2px] border-border rounded-input p-4 flex items-start gap-3">
                  {icon(c.result)}
                  <span className="grid gap-0.5">
                    <span className="font-bold text-lg">{t(`check.${c.id}` as StringKey)}{c.detail ? `: ${c.detail}` : ''}</span>
                    <span className="font-semibold text-sm">{t(`check.${c.id}.${c.result}` as StringKey)}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => playEffect('right', settings)}><SpeakerHigh weight="bold" size={18} />{t('check.trySound')}</Button>
              <Button onClick={() => speak(t('check.voiceLine'), settings)}><SpeakerHigh weight="bold" size={18} />{t('check.tryVoice')}</Button>
              <Link to="/it" className={buttonClasses('ghost')}>{t('public.nav.it')}</Link>
            </div>
          </>
        )}
        <p className="text-sm font-semibold text-muted">{t('check.private')}</p>
      </main>
      <PublicFooter />
    </>
  );
}
