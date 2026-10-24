import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ChartBar, PaintBrush, RocketLaunch, Stack, UserCircle, UsersThree } from '@phosphor-icons/react';
import { data } from '../data';
import { t } from '../i18n';
import GetStarted, { FOLDED, useStartSteps } from '../teacher/GetStarted';

// The teacher menu, on every teacher page. Until the five get started steps
// are done, a Get started pill sits in it; it opens the checklist (open on its
// own on the Classes page unless the teacher folded it).
export default function TeacherNav({ startOpen = false }: { startOpen?: boolean }) {
  const start = useStartSteps();
  const [open, setOpen] = useState<boolean | null>(null);
  const showing = open ?? (startOpen && !start?.folded);
  const link = ({ isActive }: { isActive: boolean }) =>
    `min-h-11 px-4 rounded-pill font-bold text-sm inline-flex items-center gap-1.5 no-underline ${isActive ? 'bg-accent text-accent-ink' : 'text-text hover:bg-surface-2'}`;
  const unfinished = start && start.count < start.steps.length;
  return (
    <>
      <nav aria-label={t('teacherNav.label')} className="inline-flex flex-wrap gap-1 p-1 rounded-pill bg-surface border-[2px] border-border mb-4">
        <NavLink to="/teacher/classes" className={link}><UsersThree weight="bold" size={16} />{t('teacherNav.classes')}</NavLink>
        <NavLink to="/teacher/sets" className={link}><Stack weight="bold" size={16} />{t('teacherNav.sets')}</NavLink>
        <NavLink to="/teacher/reports" className={link}><ChartBar weight="bold" size={16} />{t('teacherNav.reports')}</NavLink>
        <NavLink to="/teacher/themes" className={link}><PaintBrush weight="bold" size={16} />{t('teacherNav.themes')}</NavLink>
        <NavLink to="/teacher/account" className={link}><UserCircle weight="bold" size={16} />{t('teacherNav.account')}</NavLink>
        {unfinished && (
          <button type="button" aria-expanded={showing} onClick={() => { setOpen(!showing); if (showing) void data.setSetting(FOLDED, true); }}
            className={`min-h-11 px-4 rounded-pill font-bold text-sm inline-flex items-center gap-1.5 border-[2px] border-border ${showing ? 'bg-surface-2' : 'bg-accent text-accent-ink'}`}>
            <RocketLaunch weight="fill" size={16} />{t('start.pill', { done: start.count, total: start.steps.length })}
          </button>
        )}
      </nav>
      {unfinished && showing && <GetStarted steps={start.steps} count={start.count} onFold={() => { setOpen(false); void data.setSetting(FOLDED, true); }} />}
    </>
  );
}
