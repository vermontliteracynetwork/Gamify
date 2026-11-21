import { useEffect, useState, type ReactNode } from 'react';
import { ShieldCheck } from '@phosphor-icons/react';
import { supabase } from '../data/supabase';
import { t } from '../i18n';
import { Button, Panel } from '../ui/kit';

// Two-step sign-in for teachers (security audit, 2026-11-20): an
// authenticator app code after the password. Teachers turn it on in
// Account; once on, every teacher page asks for the code after sign-in.
// It needs MFA (TOTP) switched on in Supabase Authentication.

function CodeForm({ onCode, busy, center = false }: { onCode: (code: string) => void; busy?: boolean; center?: boolean }) {
  const [code, setCode] = useState('');
  return (
    <form className={`flex flex-wrap items-center gap-2 ${center ? 'justify-center' : ''}`} onSubmit={(e) => { e.preventDefault(); onCode(code.trim()); }}>
      <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" aria-label={t('twoStep.code')} placeholder="123456"
        className="min-h-12 w-36 px-3 rounded-input border-std border-border font-bold text-xl tracking-[0.3em] text-center" />
      <Button variant="primary" type="submit" disabled={busy || code.length !== 6}>{t('twoStep.go')}</Button>
    </form>
  );
}

// Teacher pages wait for the code when the account has two-step sign-in on.
export function TwoStepGate({ children }: { children: ReactNode }) {
  const [need, setNeed] = useState<'checking' | 'ok' | string>(supabase ? 'checking' : 'ok');
  const [problem, setProblem] = useState('');
  useEffect(() => {
    if (!supabase) return;
    void (async () => {
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (!aal || aal.nextLevel !== 'aal2' || aal.currentLevel === 'aal2') { setNeed('ok'); return; }
      const { data: f } = await supabase.auth.mfa.listFactors();
      const totp = f?.totp.find((x) => x.status === 'verified');
      setNeed(totp ? totp.id : 'ok');
    })();
  }, []);
  if (need === 'ok') return <>{children}</>;
  if (need === 'checking') return null;
  return (
    // Centered on the page, top to bottom and side to side (teacher, 2026-11-20).
    <main className="max-w-md mx-auto px-4 min-h-[calc(100dvh-12rem)] grid place-content-center py-8">
      <Panel className="grid gap-3 justify-items-center text-center">
        <ShieldCheck weight="fill" size={44} aria-hidden="true" />
        <h1 className="font-display text-2xl">{t('twoStep.title')}</h1>
        <p className="font-semibold">{t('twoStep.ask')}</p>
        <CodeForm center onCode={async (code) => {
          const { error } = await supabase!.auth.mfa.challengeAndVerify({ factorId: need, code });
          if (error) setProblem(t('twoStep.wrong')); else setNeed('ok');
        }} />
        {problem && <p className="font-bold" role="alert">{problem}</p>}
      </Panel>
    </main>
  );
}

// The Account page panel: turn two-step sign-in on (scan a QR code, type a
// code) or off.
export function TwoStepPanel() {
  const [state, setState] = useState<{ k: 'loading' } | { k: 'off' } | { k: 'on'; id: string } | { k: 'setup'; id: string; qr: string; secret: string } | { k: 'unavailable' }>({ k: 'loading' });
  const [problem, setProblem] = useState('');
  async function load() {
    if (!supabase || !(await supabase.auth.getSession()).data.session) { setState({ k: 'unavailable' }); return; }
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) { setState({ k: 'unavailable' }); return; }
    const totp = data?.totp.find((x) => x.status === 'verified');
    setState(totp ? { k: 'on', id: totp.id } : { k: 'off' });
  }
  useEffect(() => { void load(); }, []);
  async function start() {
    setProblem('');
    const { data: f } = await supabase!.auth.mfa.listFactors();
    for (const x of f?.all ?? []) if (x.status !== 'verified') await supabase!.auth.mfa.unenroll({ factorId: x.id });
    const { data, error } = await supabase!.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Gamify' });
    if (error || !data) { setProblem(t('twoStep.notReady')); return; }
    setState({ k: 'setup', id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  }
  if (state.k === 'loading' || state.k === 'unavailable') return null;
  return (
    <Panel className="grid gap-2">
      <h2 className="font-display text-2xl flex items-center gap-2"><ShieldCheck weight="fill" size={26} aria-hidden="true" />{t('twoStep.title')}</h2>
      {state.k === 'off' && <><p className="font-semibold">{t('twoStep.offText')}</p><Button variant="primary" className="justify-self-start" onClick={() => start()}>{t('twoStep.turnOn')}</Button></>}
      {state.k === 'setup' && (
        <>
          <p className="font-semibold">{t('twoStep.scan')}</p>
          <img src={state.qr} alt={t('twoStep.qr')} className="w-44 h-44 bg-white rounded-input border-std border-border" />
          <p className="text-xs font-semibold text-muted break-all">{t('twoStep.secret', { secret: state.secret })}</p>
          <CodeForm onCode={async (code) => {
            const { error } = await supabase!.auth.mfa.challengeAndVerify({ factorId: state.id, code });
            if (error) setProblem(t('twoStep.wrong')); else { setProblem(''); setState({ k: 'on', id: state.id }); }
          }} />
        </>
      )}
      {state.k === 'on' && <><p className="font-bold" role="status">{t('twoStep.onText')}</p><Button className="justify-self-start" onClick={async () => { const { error } = await supabase!.auth.mfa.unenroll({ factorId: state.id }); if (error) setProblem(t('twoStep.offProblem')); else setState({ k: 'off' }); }}>{t('twoStep.turnOff')}</Button></>}
      {problem && <p className="font-bold" role="alert">{problem}</p>}
    </Panel>
  );
}
