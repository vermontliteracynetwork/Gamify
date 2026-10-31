import { Link } from 'react-router-dom';
import { LockSimple, SignIn } from '@phosphor-icons/react';
import { useSignedIn } from '../../auth/session';
import { UpgradeButton } from '../../billing/Upgrade';
import { THEME_TRIAL_GAME } from '../../config';
import { useTierLoaded } from '../../data/hooks';
import { t } from '../../i18n';
import { buttonClasses } from '../../ui/kit';

// Blank theme templates download only on a plan that designs themes
// (teacher, 2026-10-31): Plus, Pro and Homeschool for every game; Free for
// the one Theme Builder trial game. Signed out: log in first.
export type TemplateAccess = 'loading' | 'signin' | 'upgrade' | 'ok';
export function useTemplateAccess(gameId: string): TemplateAccess {
  const { teacher } = useSignedIn();
  const tier = useTierLoaded();
  if (!teacher) return 'signin';
  if (tier === null) return 'loading';
  return tier !== 'free' || gameId === THEME_TRIAL_GAME ? 'ok' : 'upgrade';
}

// What shows in place of the download buttons when they are locked.
export function TemplateLock({ access }: { access: TemplateAccess }) {
  if (access === 'ok' || access === 'loading') return null;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <p className="font-bold flex items-center gap-2"><LockSimple weight="bold" size={20} aria-hidden="true" />{t(access === 'signin' ? 'guide.lockSignin' : 'guide.lockPlan')}</p>
      {access === 'signin'
        ? <Link to="/login" className={buttonClasses('primary', 'hover-pop')}><SignIn weight="bold" size={18} />{t('guide.logIn')}</Link>
        : <UpgradeButton className="min-h-11 px-4" />}
    </div>
  );
}
