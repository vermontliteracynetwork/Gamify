import { useEffect, useState } from 'react';
import { CheckCircle, Clock, WarningCircle } from '@phosphor-icons/react';
import { supabase } from '../data/supabase';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { Button } from '../ui/kit';
import Title from '../ui/Title';
import PublicFooter from './PublicFooter';

type State = 'checking' | 'ok' | 'down' | 'off';
const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Is Gamify working right now? (Stage 8 public website: status page.) Checks
// run live from this device, so a teacher also learns whether their school
// network lets each part through.
export default function StatusPage() {
  const [checks, setChecks] = useState<Record<string, State>>({ app: 'ok', cloud: 'checking', live: 'checking', voice: 'checking' });
  const [at, setAt] = useState(new Date());
  async function run() {
    setAt(new Date());
    setChecks({ app: 'ok', cloud: 'checking', live: 'checking', voice: 'checking' });
    const set = (k: string, v: State) => setChecks((c) => ({ ...c, [k]: v }));
    if (!URL || !KEY || !supabase) { set('cloud', 'off'); set('live', 'off'); }
    else {
      fetch(`${URL}/auth/v1/health`, { headers: { apikey: KEY } }).then((r) => set('cloud', r.ok ? 'ok' : 'down'), () => set('cloud', 'down'));
      const ch = supabase.channel(`gamify-status-${Date.now()}`);
      const timer = window.setTimeout(() => { set('live', 'down'); void supabase!.removeChannel(ch); }, 8000);
      ch.subscribe((s) => { if (s === 'SUBSCRIBED') { window.clearTimeout(timer); set('live', 'ok'); void supabase!.removeChannel(ch); } });
    }
    const voices = () => (typeof speechSynthesis !== 'undefined' ? speechSynthesis.getVoices().length : 0);
    if (voices()) set('voice', 'ok'); else window.setTimeout(() => set('voice', voices() ? 'ok' : 'down'), 1500);
  }
  useEffect(() => { void run(); }, []);
  const icon = (s: State) => s === 'ok' ? <CheckCircle weight="fill" size={28} color="#1f7a45" aria-hidden="true" /> : s === 'checking' ? <Clock weight="bold" size={28} aria-hidden="true" /> : s === 'off' ? <CheckCircle weight="bold" size={28} aria-hidden="true" /> : <WarningCircle weight="fill" size={28} color="#9b2c3a" aria-hidden="true" />;
  return (
    <>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 grid gap-5">
        <h1 className="title-bubble text-4xl sm:text-5xl"><Title text={t('status.title')} /></h1>
        <p className="text-lg font-semibold">{t('status.sub')}</p>
        <ul className="grid gap-3 list-none p-0 m-0">
          {(['app', 'cloud', 'live', 'voice'] as const).map((k) => (
            <li key={k} className="bg-surface border-[2.5px] border-border rounded-panel p-4 flex items-start gap-3" style={{ boxShadow: 'var(--shadow-sticker)' }}>
              {icon(checks[k])}
              <div className="grid gap-0.5">
                <p className="font-display text-xl">{t(`status.${k}` as StringKey)}</p>
                <p className="font-bold" role="status">{t(`status.state.${checks[k]}` as StringKey)}</p>
                {checks[k] === 'down' && <p className="text-sm font-semibold">{t(`status.${k}.fix` as StringKey)}</p>}
              </div>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => void run()}>{t('status.again')}</Button>
          <span className="text-sm font-bold text-muted">{t('status.at', { time: at.toLocaleTimeString() })}</span>
        </div>
        <section className="bg-accent border-[2.5px] border-border rounded-panel p-5 grid gap-2">
          <h2 className="font-display text-2xl">{t('status.helpTitle')}</h2>
          <p className="font-semibold">{t('status.help')}</p>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
