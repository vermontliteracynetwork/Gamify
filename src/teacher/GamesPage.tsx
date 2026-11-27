import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, LockSimple, Play } from '@phosphor-icons/react';
import { canPlayGame } from '../config';
import { useTier } from '../data/hooks';
import { GameCover } from '../games/covers';
import { ModeDot, shownModes } from '../games/ModeBadge';
import { GAMES } from '../games/registry';
import { t } from '../i18n';
import { UpgradeButton } from '../billing/Upgrade';
import { buttonClasses, PageHeader } from '../ui/kit';
import TeacherNav from '../ui/TeacherNav';

// Every game in one place (owner, 2026-11-26: "give me a tab to give all
// games"). Each card starts an activity with that game picked, or opens its
// how-to-play page. Free plays every game but the few made for paid plans.
export default function GamesPage() {
  const tier = useTier();
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-24">
      <TeacherNav />
      <PageHeader title={t('tgames.title')} />
      <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 list-none p-0 m-0">
        {GAMES.map((g) => {
          const open = canPlayGame(tier, g.id);
          return (
            <li key={g.id} className="hover-lift bg-surface border-bold border-border rounded-panel overflow-hidden flex flex-col" style={{ boxShadow: 'var(--shadow-sticker)' }}>
              <div className="relative">
                <GameCover gameId={g.id} className={`aspect-[16/10] border-b-[2.5px] border-border ${open ? '' : 'grayscale opacity-60'}`} />
                {!open && <span className="absolute inset-0 flex items-center justify-center"><span className="w-14 h-14 rounded-full bg-surface border-heavy border-border flex items-center justify-center"><LockSimple weight="fill" size={28} aria-label={t('tgames.locked', { name: g.name })} /></span></span>}
              </div>
              <div className="p-4 flex flex-col gap-2 flex-1">
                <div className="flex items-center gap-2"><h2 className="font-heading font-bold text-xl leading-tight">{g.name}</h2><span className="flex gap-1 ml-auto">{shownModes(g.modes).map((m) => <ModeDot key={m} mode={m} small />)}</span></div>
                <p className="text-sm font-semibold text-muted">{g.tagline ?? g.description}</p>
                <div className="flex flex-wrap items-center gap-2 pt-1 mt-auto">
                  {open
                    ? <Link to={`/teacher/activity?game=${g.id}`} className={buttonClasses('main', 'min-h-11 px-4 hover-pop')}><Play weight="fill" size={18} />{t('tgames.start')}</Link>
                    : <UpgradeButton />}
                  <Link to={`/blog/how-to-play/${g.id}`} className="min-h-11 px-2 inline-flex items-center gap-1.5 font-bold text-sm text-text"><BookOpen weight="bold" size={18} />{t('tgames.how')}<ArrowRight weight="bold" size={14} /></Link>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
