import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { logIn, signUp, type SignUpProblem } from '../auth/accounts';
import { setTeacher, useTeacher } from '../auth/session';
import { cloudLogIn, cloudOn, cloudSignUp } from '../auth/cloudAuth';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { Button, buttonClasses, Tabs, fieldClasses } from '../ui/kit';
import { ScrapbookPage } from './scrapbook/Shell';
import { openUpgrade } from '../billing/Upgrade';
import { upgradeTo } from '../billing/upgrade';
import Title from '../ui/Title';
import { cleanCode, currentRef, saveRef, validCode } from '../affiliate/program';
import { data } from '../data';
import { WELCOME_SEEN } from '../billing/trial';

// Teacher log in and sign up (teacher, 2026-10-26): sign up with email,
// password, confirm password and a username; log in with username and
// password. With cloud accounts on (Stage 5) the account is in Supabase;
// without the keys (local builds) it is kept on this device.
// The look is the /brand Scrapbook Log in mockup in strength A (owner,
// 2026-11-26: "login=a"): one centered white card on the Cream ground. The
// form is the clean core, so it is never taped or tilted, and the page has
// no stickers (owner, 2026-11-26).
export default function LoginPage() {
  const [params] = useSearchParams();
  const [mode, setMode] = useState<'login' | 'signup'>(params.get('mode') === 'signup' ? 'signup' : 'login');
  const [f, setF] = useState({ username: '', email: '', password: '', confirm: '' });
  // An affiliate's code (from their link, or typed from a video).
  const [ref, setRef] = useState(() => currentRef());
  const [problems, setProblems] = useState<SignUpProblem[]>([]);
  const [wrong, setWrong] = useState(false);
  const [note, setNote] = useState<'checkEmail' | 'confirmFirst' | 'offline' | 'setup' | null>(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const teacher = useTeacher();
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => { setF({ ...f, [k]: e.target.value }); setProblems([]); setWrong(false); setNote(null); };

  // Signed in by the confirm-your-email link: straight to the teacher area.
  const left = useRef(false);
  useEffect(() => { if (cloudOn && teacher && !busy && !left.current) navigate('/teacher'); }, [teacher, busy, navigate]);

  // `fresh`: the account was just made. A new teacher sees the welcome
  // screen once (How Do You Want To Start?), unless she already picked a
  // plan on the pricing page: then the plan box opens with it ready.
  async function enter(username?: string, fresh = false) {
    left.current = true;
    if (username) setTeacher({ name: username, username, at: new Date().toISOString() });
    const plan = params.get('plan');
    if (fresh && !plan) { navigate('/teacher/welcome'); return; }
    if (fresh) await data.setSetting(WELCOME_SEEN, true);
    navigate('/teacher');
    // Picked a paid plan on the pricing page: the plan box opens with it ready.
    if (plan === 'plus' || plan === 'pro') setTimeout(() => openUpgrade(plan), 0);
    // The Homeschool plan is picked on the Homeschool page (no plan box).
    if (plan === 'homeschool') void upgradeTo('homeschool');
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (cloudOn) {
      setBusy(true);
      if (mode === 'signup') {
        const code = cleanCode(ref);
        if (validCode(code)) saveRef(code);
        const res = await cloudSignUp(f, validCode(code) ? code : '');
        if (Array.isArray(res)) setProblems(res);
        else if (res === 'ok') await enter(undefined, true);
        else setNote(res);
      } else {
        const res = await cloudLogIn(f.username, f.password);
        if (res === 'ok') void enter();
        else if (res === 'wrong') setWrong(true);
        else setNote(res === 'confirm' ? 'confirmFirst' : res === 'setup' ? 'setup' : 'offline');
      }
      setBusy(false);
      return;
    }
    if (mode === 'signup') {
      const res = await signUp(f);
      if (Array.isArray(res)) setProblems(res);
      else {
        // On this device the trial starts now (the cloud sets it on the profile).
        await data.setSetting('trial-start', res.createdAt);
        await enter(res.username, true);
      }
    } else {
      const account = await logIn(f.username, f.password);
      if (account) void enter(account.username); else setWrong(true);
    }
  }
  const field = fieldClasses('md');
  const problem = (k: SignUpProblem) => problems.includes(k) && <span id={`p-${k}`} className="text-sm font-bold text-error" role="alert">{t(`login.problem.${k}` as StringKey)}</span>;
  const bad = (...k: SignUpProblem[]) => k.some((x) => problems.includes(x));
  return (
    <ScrapbookPage strength="A" pattern="sprinkles">
    <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-4 grid justify-items-center">
      <div className="sb-card w-full max-w-[34rem] p-6 sm:p-10 grid gap-5">
        <h1 className="title-bubble text-4xl sm:text-5xl text-center whitespace-nowrap"><Title text={mode === 'signup' ? t('login.signupTitle') : t('login.title')} /></h1>
        <Tabs fill className="mb-0" label={t('login.tabs')} value={mode} onChange={(m) => { setMode(m); setProblems([]); setWrong(false); }} options={[{ id: 'login', label: t('login.tab.login') }, { id: 'signup', label: t('login.tab.signup') }]} />
        <form className="grid gap-3" onSubmit={(e) => void submit(e)} noValidate>
          {!cloudOn && <p className="text-sm font-semibold bg-surface-2 rounded-input p-3 border-std border-border-soft">{t('login.localNote')}</p>}
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
          {mode === 'signup' && (
            <label className="grid gap-1 font-bold">{t('login.ref')}
              <input value={ref} maxLength={24} autoCapitalize="characters" onChange={(e) => setRef(e.target.value)} className={field} />
              <span className="text-xs font-semibold text-muted">{t('login.refHint')}</span>
            </label>
          )}
          {wrong && <p className="font-bold text-error" role="alert">{t('login.wrong')}</p>}
          {note && <p className={`font-bold ${note === 'checkEmail' ? '' : 'text-error'}`} role={note === 'checkEmail' ? 'status' : 'alert'}>{t(`login.${note}`)}</p>}
          <Button type="submit" disabled={busy} variant="go" className="min-h-14 text-lg hover-pop">{mode === 'signup' ? t('login.create') : t('login.tab.login')}</Button>
          {/* Students: one magenta button the size of Log in, right under it (owner, 2026-11-27). */}
          <Link to="/join" className={buttonClasses('main', 'min-h-14 hover-pop justify-center !bg-[#c2185b] !text-white no-underline font-score !text-2xl')}>{t('login.joinGame')}</Link>
          {mode === 'login' && <button type="button" onClick={() => setMode('signup')} className="font-bold underline justify-self-center min-h-11">{t('login.noAccount')}</button>}
        </form>
      </div>
    </main>
    </ScrapbookPage>
  );
}
