import { useSession } from '../student/session';
import { useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChalkboardTeacher, LockSimple, Student } from '@phosphor-icons/react';
import { canPlayGame } from '../config';
import { useTierLoaded } from '../data/hooks';
import { getGame } from '../games/registry';
import { useSignedIn } from '../auth/session';
import { t } from '../i18n';
import { buttonClasses } from '../ui/kit';
import Title from '../ui/Title';
import { UpgradeButton } from '../billing/Upgrade';
import { higherTier, holdPlanForGame } from '../billing/trial';

// The games and the Arcade need a signed-in student or teacher.
export function RequireSignIn({ children }: { children: ReactNode }) {
  const { any } = useSignedIn();
  if (any) return <>{children}</>;
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-14 pb-16 grid gap-5 justify-items-center text-center">
      <h1 className="title-bubble text-5xl"><Title text={t('gate.title')} /></h1>
      <p className="font-bold text-lg">{t('gate.sub')}</p>
      <div className="grid sm:grid-cols-2 gap-4 w-full">
        <Link to="/join" className="no-underline text-text bg-butter border-bold border-border rounded-panel p-6 grid gap-2 justify-items-center" style={{ boxShadow: 'var(--shadow-sticker)' }}>
          <Student weight="fill" size={48} aria-hidden="true" /><span className="font-display text-2xl">{t('gate.student')}</span>
        </Link>
        <Link to="/login" className="no-underline text-text bg-surface border-bold border-border rounded-panel p-6 grid gap-2 justify-items-center" style={{ boxShadow: 'var(--shadow-sticker)' }}>
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
// A student who reached a game without its code: back to the join page.
function AskForCode() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-14 pb-16 grid gap-5 justify-items-center text-center">
      <h1 className="title-bubble text-4xl"><Title text={t('gate.askTitle')} /></h1>
      <p className="font-bold text-lg">{t('gate.askCode')}</p>
      <Link to="/join" className={buttonClasses('primary', '', 'lg')}>{t('results.newCode')}</Link>
    </main>
  );
}

export function RequireGame({ id, children }: { id: string; children: ReactNode }) {
  const tier = useTierLoaded();
  const { teacher } = useSignedIn();
  const session = useSession();
  if (!tier) return null;
  // A student plays only the game their code opened (teacher, 2026-10-31).
  if (!teacher && session && session.gameId !== id && !session.board?.gameIds.includes(id)) return <AskForCode />;
  // A homework link made in the Plus trial keeps its plan until its due date.
  const plan = !teacher && session?.plan ? higherTier(tier, session.plan) : tier;
  if (canPlayGame(plan, id)) return teacher ? <HeldGame>{children}</HeldGame> : <>{children}</>;
  const name = getGame(id)?.name ?? '';
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-14 pb-16 grid gap-5 justify-items-center text-center">
      <span className="w-24 h-24 rounded-full bg-surface border-heavy border-border flex items-center justify-center"><LockSimple weight="fill" size={48} aria-hidden="true" /></span>
      <h1 className="title-bubble text-4xl"><Title text={name} /></h1>
      <p className="font-bold text-lg">{teacher ? t('gate.gamePlans', { name }) : t('gate.gameAsk')}</p>
      <div className="flex flex-wrap justify-center gap-2">
        {teacher && <UpgradeButton className="min-h-14 px-8 text-lg" />}
        {teacher && <Link to="/pricing" className={buttonClasses('ghost')}>{t('gate.seePlans')}</Link>}
        <Link to={teacher ? '/play' : '/join'} className={buttonClasses('secondary')}>{teacher ? t('nav.allGames') : t('results.newCode')}</Link>
      </div>
    </main>
  );
}

// A teacher's game: a trial that ends while it is open ends after it.
function HeldGame({ children }: { children: ReactNode }) {
  useEffect(() => holdPlanForGame(), []);
  return <>{children}</>;
}

export function RequireTeacher({ children }: { children: ReactNode }) {
  const { teacher } = useSignedIn();
  if (teacher) return <>{children}</>;
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-14 pb-16 grid gap-5 justify-items-center text-center">
      <h1 className="title-bubble text-5xl"><Title text={t('gate.teacherTitle')} /></h1>
      <Link to="/login" className={buttonClasses('primary', '', 'lg')}><ChalkboardTeacher weight="bold" size={22} />{t('public.nav.login')}</Link>
    </main>
  );
}
