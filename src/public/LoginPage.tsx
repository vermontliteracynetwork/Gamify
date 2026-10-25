import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChalkboardTeacher, Student } from '@phosphor-icons/react';
import { setTeacher } from '../auth/session';
import { t } from '../i18n';
import { Button, Panel, Tabs } from '../ui/kit';
import { openUpgrade } from '../billing/Upgrade';
import Title from '../ui/Title';

// Teacher log in and sign up. Cloud accounts arrive in Stage 5; until then
// a teacher continues on this device, and everything stays on it.
export default function LoginPage() {
  const [params] = useSearchParams();
  const [mode, setMode] = useState<'login' | 'signup'>(params.get('mode') === 'signup' ? 'signup' : 'login');
  const [name, setName] = useState('');
  const navigate = useNavigate();
  function go() {
    setTeacher({ name: name.trim() || t('login.teacher'), at: new Date().toISOString() });
    navigate('/teacher');
    // Picked a paid plan on the pricing page: the plan box opens with it ready.
    const plan = params.get('plan');
    if (plan === 'plus' || plan === 'pro') setTimeout(() => openUpgrade(plan), 0);
  }
  return (
    <main className="max-w-xl mx-auto px-4 pt-10 pb-16 grid gap-4">
      <h1 className="title-bubble text-5xl text-center"><Title text={mode === 'signup' ? t('login.signupTitle') : t('login.title')} /></h1>
      <Tabs label={t('login.tabs')} value={mode} onChange={setMode} options={[{ id: 'login', label: t('login.tab.login') }, { id: 'signup', label: t('login.tab.signup') }]} />
      <Panel className="grid gap-3">
        <p className="font-bold flex items-center gap-2"><ChalkboardTeacher weight="bold" size={22} />{t('login.forTeachers')}</p>
        <p className="text-sm font-semibold bg-surface-2 rounded-input p-3 border-[2px] border-border-soft">{t('login.localNote')}</p>
        <label className="grid gap-1 font-bold">{t('login.name')}
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('login.namePlaceholder')} maxLength={40} className="min-h-12 px-3 rounded-input border-[2px] border-border font-bold" />
        </label>
        <Button variant="primary" className="min-h-14 text-lg" onClick={go}>{t('login.continue')}</Button>
      </Panel>
      <Panel className="flex flex-wrap items-center gap-3 bg-surface-2">
        <Student weight="bold" size={28} aria-hidden="true" />
        <p className="font-bold flex-1">{t('login.students')}</p>
        <Button onClick={() => navigate('/join')}>{t('public.joinCode')}</Button>
      </Panel>
    </main>
  );
}
