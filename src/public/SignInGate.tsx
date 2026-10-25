import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChalkboardTeacher, LockSimple, Student } from '@phosphor-icons/react';
import { canPlayGame } from '../config';
import { useTierLoaded } from '../data/hooks';
import { getGame } from '../games/registry';
import { useSignedIn } from '../auth/session';
import { t } from '../i18n';
import { buttonClasses } from '../ui/kit';
import Title from '../ui/Title';

// The games and the Arcade need a signed-in student or teacher.
export function RequireSignIn({ children }: { children: ReactNode }) {
  const { any } = useSignedIn();
  if (any) return <>{children}</>;
  return (
    <main className="max-w-2xl mx-auto px-4 pt-14 pb-16 grid gap-5 justify-items-center text-center">
      <h1 className="title-bubble text-5xl"><Title text={t('gate.title')} /></h1>
      <p className="font-bold text-lg">{t('gate.sub')}</p>
      <div className="grid sm:grid-cols-2 gap-4 w-full">
        <Link to="/join" className="no-underline text-text bg-accent border-[2.5px] border-border rounded-panel p-6 grid gap-2 justify-items-center" style={{ boxShadow: 'var(--shadow-sticker)' }}>
          <Student weight="fill" size={48} aria-hidden="true" /><span className="font-display text-2xl">{t('gate.student')}</span>
        </Link>
        <Link to="/login" className="no-underline text-text bg-surface border-[2.5px] border-border rounded-panel p-6 grid gap-2 justify-items-center" style={{ boxShadow: 'var(--shadow-sticker)' }}>
          <ChalkboardTeacher weight="fill" size={48} aria-hidden="true" /><span className="font-display text-2xl">{t('gate.teacher')}</span>
        </Link>
      </div>
      <Link to="/" className={buttonClasses('ghost')}>{t('gate.home')}</Link>
    </main>
  );
}

// A game outside the plan (reached by its web address). Students see only a
// lock and "ask your teacher" (no prices or buy words on student pages);
// teachers see which plans include it.
export function RequireGame({ id, children }: { id: string; children: ReactNode }) {
  const tier = useTierLoaded();
  const { teacher } = useSignedIn();
  if (!tier) return null;
  if (canPlayGame(tier, id)) return <>{children}</>;
  const name = getGame(id)?.name ?? '';
  return (
    <main className="max-w-lg mx-auto px-4 pt-14 pb-16 grid gap-5 justify-items-center text-center">
      <span className="w-24 h-24 rounded-full bg-surface border-[3px] border-border flex items-center justify-center"><LockSimple weight="fill" size={48} aria-hidden="true" /></span>
      <h1 className="title-bubble text-4xl"><Title text={name} /></h1>
      <p className="font-bold text-lg">{teacher ? t('gate.gamePlans', { name }) : t('gate.gameAsk')}</p>
      <div className="flex flex-wrap justify-center gap-2">
        {teacher && <Link to="/pricing" className={buttonClasses('primary')}>{t('gate.seePlans')}</Link>}
        <Link to={teacher ? '/play' : '/arcade'} className={buttonClasses('secondary')}>{teacher ? t('nav.allGames') : t('nav.myArcade')}</Link>
      </div>
    </main>
  );
}

export function RequireTeacher({ children }: { children: ReactNode }) {
  const { teacher } = useSignedIn();
  if (teacher) return <>{children}</>;
  return (
    <main className="max-w-lg mx-auto px-4 pt-14 pb-16 grid gap-5 justify-items-center text-center">
      <h1 className="title-bubble text-5xl"><Title text={t('gate.teacherTitle')} /></h1>
      <Link to="/login" className={buttonClasses('primary', 'min-h-14 px-8 text-lg')}><ChalkboardTeacher weight="bold" size={22} />{t('public.nav.login')}</Link>
    </main>
  );
}
