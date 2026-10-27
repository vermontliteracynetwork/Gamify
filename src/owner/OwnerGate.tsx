import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from '@phosphor-icons/react';
import { supabase } from '../data/supabase';
import { t } from '../i18n';
import { Button, buttonClasses } from '../ui/kit';

// The owner dashboard with cloud accounts on (Stage 7B: "only your account,
// with two-step sign-in"): signed in as the owner account, then a code from
// an authenticator app. The first time, it sets the app up with a QR code.
type Step = { k: 'loading' } | { k: 'signin' } | { k: 'notOwner' } | { k: 'enroll'; factorId: string; qr: string; secret: string } | { k: 'verify'; factorId: string } | { k: 'open' };

export default function OwnerGate({ children }: { children: ReactNode }) {
  const [step, setStep] = useState<Step>({ k: 'loading' });
  const [code, setCode] = useState('');
  const [problem, setProblem] = useState('');
  useEffect(() => { void check(); }, []);
  async function check() {
    const sb = supabase!;
    if (!(await sb.auth.getSession()).data.session) { setStep({ k: 'signin' }); return; }
    const { data: { user } } = await sb.auth.getUser();
    const { data: me } = await sb.from('profiles').select('*').eq('id', user!.id).maybeSingle();
    if (!(me as { is_owner?: boolean } | null)?.is_owner) { setStep({ k: 'notOwner' }); return; }
    const { data: aal } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.currentLevel === 'aal2') { setStep({ k: 'open' }); return; }
    const { data: factors } = await sb.auth.mfa.listFactors();
    const totp = factors?.totp.find((f) => f.status === 'verified');
    if (totp) { setStep({ k: 'verify', factorId: totp.id }); return; }
    // Unfinished set-ups are cleared so a fresh QR code shows.
    for (const f of factors?.all ?? []) if (f.status !== 'verified') await sb.auth.mfa.unenroll({ factorId: f.id });
    const { data, error } = await sb.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Gamify owner' });
    if (error || !data) { setProblem(t('ownerGate.enrollProblem')); setStep({ k: 'signin' }); return; }
    setStep({ k: 'enroll', factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  }
  async function verify(factorId: string) {
    setProblem('');
    const { error } = await supabase!.auth.mfa.challengeAndVerify({ factorId, code: code.trim() });
    if (error) { setProblem(t('ownerGate.wrong')); return; }
    setStep({ k: 'open' });
  }
  if (step.k === 'open') return <>{children}</>;
  const box = 'max-w-md mx-auto px-4 pt-10 pb-24';
  const panel = 'bg-surface border-[2.5px] border-border rounded-panel p-5 grid gap-3 justify-items-center text-center';
  return (
    <main className={box}>
      <div className={panel} style={{ boxShadow: 'var(--shadow-sticker)' }}>
        <ShieldCheck weight="fill" size={48} aria-hidden="true" />
        <h1 className="font-display text-2xl">{t('owner.title')}</h1>
        {step.k === 'loading' && <p className="font-semibold">{t('owner.loading')}</p>}
        {step.k === 'signin' && <><p className="font-semibold">{t('ownerGate.signIn')}</p><Link to="/login" className={buttonClasses('primary')}>{t('ownerGate.toLogin')}</Link></>}
        {step.k === 'notOwner' && <p className="font-semibold">{t('ownerGate.notOwner')}</p>}
        {step.k === 'enroll' && (
          <>
            <p className="font-semibold">{t('ownerGate.enroll')}</p>
            <img src={step.qr} alt={t('ownerGate.qr')} className="w-48 h-48 bg-white rounded-input border-[2px] border-border" />
            <p className="text-xs font-semibold text-muted break-all">{t('ownerGate.secret', { secret: step.secret })}</p>
          </>
        )}
        {step.k === 'verify' && <p className="font-semibold">{t('ownerGate.verify')}</p>}
        {(step.k === 'enroll' || step.k === 'verify') && (
          <form className="flex flex-wrap justify-center gap-2" onSubmit={(e) => { e.preventDefault(); void verify(step.factorId); }}>
            <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" aria-label={t('ownerGate.code')} placeholder="123456"
              className="min-h-12 w-36 px-3 rounded-input border-[2px] border-border font-bold text-xl tracking-[0.3em] text-center" />
            <Button variant="primary" type="submit" disabled={code.length !== 6}>{t('ownerGate.go')}</Button>
          </form>
        )}
        {problem && <p className="font-bold" role="alert">{problem}</p>}
      </div>
    </main>
  );
}
