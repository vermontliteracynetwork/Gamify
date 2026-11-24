import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChartBar, ChatTeardropText, House, PaintBrush, Plus, RocketLaunch, Stack, UserCircle, UsersThree } from '@phosphor-icons/react';
import TeacherSurvey from '../beta/TeacherSurvey';
import { surveyDue, type SurveyId } from '../beta/surveys';
import { t } from '../i18n';
import GetStarted, { useStartSteps } from '../teacher/GetStarted';
import BetaChecklist from '../teacher/BetaChecklist';
import { useBetaSteps, useBetaTester } from '../beta/tester';
import { useTier } from '../data/hooks';
import { TIERS } from '../config';

// The teacher menu, on every teacher page. Until the five get started steps
// are done, the checklist sits at the top of every teacher tab (teacher,
// 2026-10-25); the X folds it into the Get started pill for this page only.
// `startOpen` false: the Get started panel waits behind its pill (full-screen
// tools like the Theme Builder need the room; teacher, 2026-10-31).
export default function TeacherNav({ startOpen = true, rail: withRail = true }: { startOpen?: boolean; rail?: boolean }) {
  const start = useStartSteps();
  const betaOn = useBetaTester();
  const { value: beta } = useBetaSteps(betaOn);
  const tier = useTier();
  const [open, setOpen] = useState<boolean | null>(null);
  // A beta survey that has come due shows as a pill too.
  const [survey, setSurvey] = useState<SurveyId | null>(null);
  const [surveyOpen, setSurveyOpen] = useState(false);
  useEffect(() => { void surveyDue().then(setSurvey); }, []);
  const showing = open ?? startOpen;
  const link = ({ isActive }: { isActive: boolean }) =>
    `min-h-9 px-3 rounded-pill font-bold text-xs lg:text-sm inline-flex flex-1 justify-center whitespace-nowrap items-center gap-1.5 no-underline ${isActive ? 'bg-accent text-accent-ink' : 'text-text hover:bg-surface-2'}`;
  // Not on Account (teacher, 2026-10-26): that page is for the plan and settings.
  const onAccount = useLocation().pathname.startsWith('/teacher/account');
  const unfinished = start && start.count < start.steps.length && !onAccount;
  // The left rail (approved teacher portal, batch 6, 2026-11-24): on wide
  // screens every place is always showing, with Create an Activity on top
  // (recognition over recall; Fitts's law for the most used task). Narrower
  // screens keep the pill bar, so an iPad keeps its full width.
  const rail = ({ isActive }: { isActive: boolean }) =>
    `min-h-11 px-3 rounded-input inline-flex items-center gap-3 font-bold no-underline text-text ${isActive ? 'bg-gamify shadow-[inset_0.25rem_0_0_var(--color-grape)]' : 'hover:bg-surface-2'}`;
  return (
    <>
      {withRail && <nav aria-label={t('teacherNav.label')} className="teacher-rail no-print hidden min-[1100px]:flex fixed left-0 top-14 bottom-0 z-40 w-[14.5rem] flex-col gap-1.5 px-4 py-5 overflow-y-auto bg-surface border-r-[2.5px] border-border">
        <NavLink to="/teacher/activity" className="hover-pop min-h-12 mb-2 rounded-pill inline-flex items-center justify-center gap-2 font-bold no-underline text-white bg-grape border-std border-border shadow-[0_0.2rem_0_var(--color-border)]"><Plus weight="bold" size={18} />{t('teacherNav.create')}</NavLink>
        <NavLink to="/teacher" end className={rail}><House weight="bold" size={20} />{t('teacherNav.home')}</NavLink>
        <NavLink to="/teacher/classes" className={rail}><UsersThree weight="bold" size={20} />{!TIERS[tier].hasClasses ? t('teacherNav.students') : t('teacherNav.classes')}</NavLink>
        <NavLink to="/teacher/sets" className={rail}><Stack weight="bold" size={20} />{t('teacherNav.sets')}</NavLink>
        <NavLink to="/teacher/reports" className={rail}><ChartBar weight="bold" size={20} />{t('teacherNav.reports')}</NavLink>
        <NavLink to="/teacher/themes" className={rail}><PaintBrush weight="bold" size={20} />{t('teacherNav.themes')}</NavLink>
        <NavLink to="/teacher/account" className={rail}><UserCircle weight="bold" size={20} />{t('teacherNav.account')}</NavLink>
        <span className="flex-1" />
        {unfinished && (
          <button type="button" aria-expanded={showing} onClick={() => setOpen(!showing)} className="min-h-10 px-3 rounded-pill font-bold text-sm inline-flex justify-center items-center gap-1.5 border-std border-border bg-accent text-accent-ink">
            <RocketLaunch weight="fill" size={16} />{t('start.pill', { done: start.count, total: start.steps.length })}
          </button>
        )}
        {survey && (
          <button type="button" onClick={() => setSurveyOpen(true)} className="min-h-10 px-3 rounded-pill font-bold text-sm inline-flex justify-center items-center gap-1.5 border-std border-border bg-secondary">
            <ChatTeardropText weight="fill" size={16} />{t('survey.pill')}
          </button>
        )}
      </nav>}
      <nav aria-label={t('teacherNav.label')} className={`${withRail ? 'min-[1100px]:hidden ' : ''}flex-wrap w-full gap-0.5 p-0.5 rounded-[1.5rem] bg-surface border-std border-border mb-3`}>
        <NavLink to="/teacher" end className={link}><House weight="bold" size={16} />{t('teacherNav.home')}</NavLink>
        <NavLink to="/teacher/classes" className={link}><UsersThree weight="bold" size={16} />{!TIERS[tier].hasClasses ? t('teacherNav.students') : t('teacherNav.classes')}</NavLink>
        <NavLink to="/teacher/sets" className={link}><Stack weight="bold" size={16} />{t('teacherNav.sets')}</NavLink>
        <NavLink to="/teacher/reports" className={link}><ChartBar weight="bold" size={16} />{t('teacherNav.reports')}</NavLink>
        <NavLink to="/teacher/themes" className={link}><PaintBrush weight="bold" size={16} />{t('teacherNav.themes')}</NavLink>
        <NavLink to="/teacher/account" className={link}><UserCircle weight="bold" size={16} />{t('teacherNav.account')}</NavLink>
        {unfinished && (
          <button type="button" aria-expanded={showing} onClick={() => setOpen(!showing)}
            className={`min-h-8 px-3 rounded-pill font-bold text-xs inline-flex flex-1 justify-center whitespace-nowrap items-center gap-1.5 border-std border-border ${showing ? 'bg-surface-2' : 'bg-accent text-accent-ink'}`}>
            <RocketLaunch weight="fill" size={16} />{t('start.pill', { done: start.count, total: start.steps.length })}
          </button>
        )}
        {survey && (
          <button type="button" onClick={() => setSurveyOpen(true)}
            className="min-h-8 px-3 rounded-pill font-bold text-xs inline-flex flex-1 justify-center whitespace-nowrap items-center gap-1.5 border-std border-border bg-secondary">
            <ChatTeardropText weight="fill" size={16} />{t('survey.pill')}
          </button>
        )}
      </nav>
      {survey && surveyOpen && <TeacherSurvey id={survey} onClose={() => { setSurveyOpen(false); void surveyDue().then(setSurvey); }} />}
      {beta && !onAccount && <BetaChecklist s={beta} />}
      {unfinished && showing && <GetStarted steps={start.steps} count={start.count} onFold={() => setOpen(false)} />}
    </>
  );
}
