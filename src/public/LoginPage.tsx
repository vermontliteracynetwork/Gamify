import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChalkboardTeacher, Student } from '@phosphor-icons/react';
import { logIn, signUp, type SignUpProblem } from '../auth/accounts';
import { setTeacher, useTeacher } from '../auth/session';
import { cloudLogIn, cloudOn, cloudSignUp } from '../auth/cloudAuth';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { Button, Panel, Tabs } from '../ui/kit';
import { openUpgrade } from '../billing/Upgrade';
import { upgradeTo } from '../billing/upgrade';
import Title from '../ui/Title';

// Teacher log in and sign up (teacher, 2026-10-26): sign up with email,
// password, confirm password and a username; log in with username and
// password. With cloud accounts on (Stage 5) the account is in Supabase;
// without the keys (local builds) it is kept on this device.
export default function LoginPage() {
  const [params] = useSearchParams();
  const [mode, setMode] = useState<'login' | 'signup'>(params.get('mode') === 'signup' ? 'signup' : 'login');
  const [f, setF] = useState({ username: '', email: '', password: '', confirm: '' });
  const [problems, setProblems] = useState<SignUpProblem[]>([]);
  const [wrong, setWrong] = useState(false);
  const [note, setNote] = useState<'checkEmail' | 'confirmFirst' | 'offline' | 'setup' | null>(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const teacher = useTeacher();
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => { setF({ ...f, [k]: e.target.value }); setProblems([]); setWrong(false); setNote(null); };

  // Signed in by the confirm-your-email link: straight to the teacher area.
  useEffect(() => { if (cloudOn && teacher && !busy) navigate('/teacher'); }, [teacher, busy, navigate]);

  function enter(username?: string) {
    if (username) setTeacher({ name: username, username, at: new Date().toISOString() });
    navigate('/teacher');
    // Picked a paid plan on the pricing page: the plan box opens with it ready.
    const plan = params.get('plan');
    if (plan === 'plus' || plan === 'pro') setTimeout(() => openUpgrade(plan), 0);
    // The Homeschool plan is picked on the Homeschool page (no plan box).
    if (plan === 'homeschool') void upgradeTo('homeschool');
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (cloudOn) {
      setBusy(true);
      if (mode === 'signup') {
        const res = await cloudSignUp(f);
        if (Array.isArray(res)) setProblems(res);
        else if (res === 'ok') enter();
        else setNote(res);
      } else {
        const res = await cloudLogIn(f.username, f.password);
        if (res === 'ok') enter();
        else if (res === 'wrong') setWrong(true);
        else setNote(res === 'confirm' ? 'confirmFirst' : res === 'setup' ? 'setup' : 'offline');
      }
      setBusy(false);
      return;
    }
    if (mode === 'signup') {
      const res = await signUp(f);
      if (Array.isArray(res)) setProblems(res); else enter(res.username);
    } else {
      const account = await logIn(f.username, f.password);
      if (account) enter(account.username); else setWrong(true);
    }
  }
  const field = 'min-h-12 px-3 rounded-input border-[2px] border-border font-bold';
  const problem = (k: SignUpProblem) => problems.includes(k) && <span id={`p-${k}`} className="text-sm font-bold text-[#9b2c3a]" role="alert">{t(`login.problem.${k}` as StringKey)}</span>;
  const bad = (...k: SignUpProblem[]) => k.some((x) => problems.includes(x));
  return (
    <main className="max-w-xl mx-auto px-4 pt-10 pb-16 grid gap-4">
      <h1 className="title-bubble text-5xl text-center"><Title text={mode === 'signup' ? t('login.signupTitle') : t('login.title')} /></h1>
      <Tabs label={t('login.tabs')} value={mode} onChange={(m) => { setMode(m); setProblems([]); setWrong(false); }} options={[{ id: 'login', label: t('login.tab.login') }, { id: 'signup', label: t('login.tab.signup') }]} />
      <Panel>
        <form className="grid gap-3" onSubmit={(e) => void submit(e)} noValidate>
          <p className="font-bold flex items-center gap-2"><ChalkboardTeacher weight="bold" size={22} />{t('login.forTeachers')}</p>
          {!cloudOn && <p className="text-sm font-semibold bg-surface-2 rounded-input p-3 border-[2px] border-border-soft">{t('login.localNote')}</p>}
          {mode === 'signup' && (
            <label className="grid gap-1 font-bold">{t('login.email')}
              <input type="email" autoComplete="email" value={f.email} onChange={set('email')} aria-invalid={bad('email', 'emailTaken')} className={field} />
              {problem('email')}{problem('emailTaken')}
            </label>
          )}
          <label className="grid gap-1 font-bold">{cloudOn && mode === 'login' ? t('login.usernameOrEmail') : t('login.username')}
            <input autoComplete="username" autoCapitalize="none" spellCheck={false} value={f.username} onChange={set('username')} maxLength={cloudOn && mode === 'login' ? 254 : 20} aria-invalid={bad('username', 'usernameTaken')} className={field} />
            {mode === 'signup' && <span className="text-xs font-semibold text-muted">{t('login.usernameHint')}</span>}
            {problem('username')}{problem('usernameTaken')}
          </label>
          <label className="grid gap-1 font-bold">{t('login.password')}
            <input type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={f.password} onChange={set('password')} aria-invalid={bad('password')} className={field} />
            {problem('password')}
          </label>
          {mode === 'signup' && (
            <label className="grid gap-1 font-bold">{t('login.confirm')}
              <input type="password" autoComplete="new-password" value={f.confirm} onChange={set('confirm')} aria-invalid={bad('confirm')} className={field} />
              {problem('confirm')}
            </label>
          )}
          {wrong && <p className="font-bold text-[#9b2c3a]" role="alert">{t('login.wrong')}</p>}
          {note && <p className={`font-bold ${note === 'checkEmail' ? '' : 'text-[#9b2c3a]'}`} role={note === 'checkEmail' ? 'status' : 'alert'}>{t(`login.${note}`)}</p>}
          <Button type="submit" disabled={busy} variant="primary" className="min-h-14 text-lg">{mode === 'signup' ? t('login.create') : t('login.tab.login')}</Button>
          {mode === 'login' && <button type="button" onClick={() => setMode('signup')} className="font-bold underline justify-self-center min-h-11">{t('login.noAccount')}</button>}
        </form>
      </Panel>
      <Panel className="flex flex-wrap items-center gap-3 bg-surface-2">
        <Student weight="bold" size={28} aria-hidden="true" />
        <p className="font-bold flex-1">{t('login.students')}</p>
        <Button onClick={() => navigate('/join')}>{t('public.joinCode')}</Button>
      </Panel>
    </main>
  );
}
