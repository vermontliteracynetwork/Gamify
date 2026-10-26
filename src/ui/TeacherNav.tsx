import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChartBar, ChatTeardropText, PaintBrush, RocketLaunch, Stack, UserCircle, UsersThree } from '@phosphor-icons/react';
import TeacherSurvey from '../beta/TeacherSurvey';
import { surveyDue, type SurveyId } from '../beta/surveys';
import { t } from '../i18n';
import GetStarted, { useStartSteps } from '../teacher/GetStarted';
import { useTier } from '../data/hooks';
import { TIERS } from '../config';

// The teacher menu, on every teacher page. Until the five get started steps
// are done, the checklist sits at the top of every teacher tab (teacher,
// 2026-10-25); the X folds it into the Get started pill for this page only.
export default function TeacherNav(_props: { startOpen?: boolean }) {
  const start = useStartSteps();
  const tier = useTier();
  const [open, setOpen] = useState<boolean | null>(null);
  // A beta survey that has come due shows as a pill too.
  const [survey, setSurvey] = useState<SurveyId | null>(null);
  const [surveyOpen, setSurveyOpen] = useState(false);
  useEffect(() => { void surveyDue().then(setSurvey); }, []);
  const showing = open ?? true;
  const link = ({ isActive }: { isActive: boolean }) =>
    `min-h-11 px-4 rounded-pill font-bold text-sm inline-flex flex-1 justify-center whitespace-nowrap items-center gap-1.5 no-underline ${isActive ? 'bg-accent text-accent-ink' : 'text-text hover:bg-surface-2'}`;
  // Not on Account (teacher, 2026-10-26): that page is for the plan and settings.
  const onAccount = useLocation().pathname.startsWith('/teacher/account');
  const unfinished = start && start.count < start.steps.length && !onAccount;
  return (
    <>
      <nav aria-label={t('teacherNav.label')} className="flex flex-wrap w-full gap-1 p-1 rounded-[1.75rem] bg-surface border-[2px] border-border mb-4">
        <NavLink to="/teacher/classes" className={link}><UsersThree weight="bold" size={16} />{!TIERS[tier].hasClasses ? t('teacherNav.students') : t('teacherNav.classes')}</NavLink>
        <NavLink to="/teacher/sets" className={link}><Stack weight="bold" size={16} />{t('teacherNav.sets')}</NavLink>
        <NavLink to="/teacher/reports" className={link}><ChartBar weight="bold" size={16} />{t('teacherNav.reports')}</NavLink>
        <NavLink to="/teacher/themes" className={link}><PaintBrush weight="bold" size={16} />{t('teacherNav.themes')}</NavLink>
        <NavLink to="/teacher/account" className={link}><UserCircle weight="bold" size={16} />{t('teacherNav.account')}</NavLink>
        {unfinished && (
          <button type="button" aria-expanded={showing} onClick={() => setOpen(!showing)}
            className={`min-h-11 px-4 rounded-pill font-bold text-sm inline-flex flex-1 justify-center whitespace-nowrap items-center gap-1.5 border-[2px] border-border ${showing ? 'bg-surface-2' : 'bg-accent text-accent-ink'}`}>
            <RocketLaunch weight="fill" size={16} />{t('start.pill', { done: start.count, total: start.steps.length })}
          </button>
        )}
        {survey && (
          <button type="button" onClick={() => setSurveyOpen(true)}
            className="min-h-11 px-4 rounded-pill font-bold text-sm inline-flex flex-1 justify-center whitespace-nowrap items-center gap-1.5 border-[2px] border-border bg-secondary">
            <ChatTeardropText weight="fill" size={16} />{t('survey.pill')}
          </button>
        )}
      </nav>
      {survey && surveyOpen && <TeacherSurvey id={survey} onClose={() => { setSurveyOpen(false); void surveyDue().then(setSurvey); }} />}
      {unfinished && showing && <GetStarted steps={start.steps} count={start.count} onFold={() => setOpen(false)} />}
    </>
  );
}
