import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ArrowRight, CaretUp, ChartBar, ChatTeardropText, Flag, GameController, House, PaintBrush, Plus, Question, Sticker, RocketLaunch, SignOut, Stack, UserCircle, UsersThree } from '@phosphor-icons/react';
import { setTeacher } from '../auth/session';
import { data } from '../data';
import { useAsync } from '../data/hooks';
import { useIsOwner } from '../owner/useIsOwner';
import { openReport } from './NavBar';
import TeacherSurvey from '../beta/TeacherSurvey';
import { surveyDue, type SurveyId } from '../beta/surveys';
import { t } from '../i18n';
import GetStarted, { useStartSteps } from '../teacher/GetStarted';
import BetaChecklist from '../teacher/BetaChecklist';
import { useBetaSteps, useBetaTester } from '../beta/tester';
import { useTier } from '../data/hooks';
import { TIERS } from '../config';
import TrialNotes, { TrialChip } from '../billing/TrialNotes';

// The teacher menu, on every teacher page. The get started checklist lives on
// Teacher Home only (approved /brand teacher portal, owner 2026-11-25); every
// other page keeps the Get started pill, which opens it here on a tap.
export default function TeacherNav({ startOpen = false, rail: withRail = true }: { startOpen?: boolean; rail?: boolean }) {
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
    `min-h-9 px-3 rounded-pill font-bold text-xs lg:text-sm inline-flex flex-1 justify-center whitespace-nowrap items-center gap-1.5 no-underline ${isActive ? 'bg-butter text-accent-ink' : 'text-text hover:bg-surface-2'}`;
  // Not on Account (teacher, 2026-10-26): that page is for the plan and settings.
  const onAccount = useLocation().pathname.startsWith('/teacher/account');
  const unfinished = start && start.count < start.steps.length && !onAccount;
  // The left rail (approved teacher portal Shell, 2026-11-25): on wide screens
  // it replaces the public top bar, with the logo on top, Create an Activity
  // under it (recognition over recall; Fitts's law for the most used task),
  // every place always showing, and the class switcher at its foot so every
  // page answers "which class?". The site, All games, Help, Report and Log out
  // stay one tap away in the round buttons at the very bottom. Narrower
  // screens keep the public bar and the pill menu, so an iPad keeps its width.
  // No Search: Gamify has no search across teacher pages yet. No Activities
  // item: there is no Activities list page yet, so Create an Activity stays.
  const owner = useIsOwner();
  const round = 'w-11 h-11 shrink-0 rounded-full grid place-items-center border-std border-border bg-white hover:bg-surface-hover text-text no-underline';
  const rail = ({ isActive }: { isActive: boolean }) =>
    `rail-item min-h-11 px-3 rounded-input inline-flex items-center gap-3 font-bold no-underline text-text ${isActive ? 'bg-gamify shadow-[inset_0.25rem_0_0_var(--color-grape)]' : 'hover:bg-surface-2'}`;
  return (
    <>
      {withRail && <nav aria-label={t('teacherNav.label')} className="teacher-rail no-print hidden min-[1100px]:flex fixed left-0 top-0 bottom-0 z-40 w-[14.5rem] flex-col gap-1.5 px-4 py-4 overflow-y-auto bg-surface border-r-[2.5px] border-border">
        <Link to="/" aria-label={t('teacherNav.site')} title={t('teacherNav.site')} className="rail-logo self-start min-h-11 flex items-center mb-2 active:scale-95 motion-safe:transition-transform">
          <img src="/brand/gamify-wordmark.png" alt="Gamify" className="h-9 w-auto" draggable="false" />
        </Link>
        <NavLink to="/teacher/activity" className="hover-pop min-h-12 mb-2 rounded-pill inline-flex items-center justify-center gap-2 font-bold no-underline text-white bg-grape hover:bg-grape-deep border-std border-border shadow-[0_0.2rem_0_var(--grape-deep)]"><Plus weight="bold" size={18} />{t('teacherNav.create')}</NavLink>
        <NavLink to="/teacher" end className={rail}><House weight="bold" size={20} />{t('teacherNav.home')}</NavLink>
        <NavLink to="/teacher/classes" className={rail}><UsersThree weight="bold" size={20} />{!TIERS[tier].hasClasses ? t('teacherNav.students') : t('teacherNav.classes')}</NavLink>
        <NavLink to="/teacher/sets" className={rail}><Stack weight="bold" size={20} />{t('teacherNav.sets')}</NavLink>
        <NavLink to="/teacher/reports" className={rail}><ChartBar weight="bold" size={20} />{t('teacherNav.reports')}</NavLink>
        <NavLink to="/teacher/themes" className={rail}><PaintBrush weight="bold" size={20} />{t('teacherNav.themes')}</NavLink>
        <NavLink to="/teacher/achievements" className={rail}><Sticker weight="bold" size={20} />{t('teacherNav.achievements')}</NavLink>
        <NavLink to="/teacher/account" className={rail}><UserCircle weight="bold" size={20} />{t('teacherNav.account')}</NavLink>
        <span className="flex-1" />
        {unfinished && (
          <button type="button" aria-expanded={showing} onClick={() => setOpen(!showing)} className="min-h-10 px-3 rounded-pill font-bold text-sm inline-flex justify-center items-center gap-1.5 border-std border-border bg-butter text-text">
            <RocketLaunch weight="fill" size={16} />{t('start.pill', { done: start.count, total: start.steps.length })}
          </button>
        )}
        {survey && (
          <button type="button" onClick={() => setSurveyOpen(true)} className="min-h-10 px-3 rounded-pill font-bold text-sm inline-flex justify-center items-center gap-1.5 border-std border-border bg-secondary">
            <ChatTeardropText weight="fill" size={16} />{t('survey.pill')}
          </button>
        )}
        <ClassSwitcher />
        <div className="flex items-center justify-between gap-1 pt-1">
          <Link to="/play" aria-label={t('nav.allGames')} title={t('nav.allGames')} className={round}><GameController weight="bold" size={20} /></Link>
          <Link to="/help" aria-label={t('public.nav.help')} title={t('public.nav.help')} className={round}><Question weight="bold" size={20} /></Link>
          <button type="button" onClick={openReport} aria-label={t('report.open')} title={t('report.open')} className={round}><Flag weight="bold" size={20} /></button>
          <button type="button" onClick={() => setTeacher(null)} aria-label={t('nav.logOut')} title={t('nav.logOut')} className={round}><SignOut weight="bold" size={20} /></button>
        </div>
        {owner && <Link to="/owner" className="min-h-10 px-3 rounded-pill inline-flex items-center justify-center font-bold text-sm no-underline text-text border-std border-border bg-danger hover:bg-blush">{t('nav.devPortal')}</Link>}
      </nav>}
      <nav aria-label={t('teacherNav.label')} className={`${withRail ? 'min-[1100px]:hidden ' : ''}flex-wrap w-full gap-0.5 p-0.5 rounded-[1.5rem] bg-surface border-std border-border mb-3`}>
        <NavLink to="/teacher" end className={link}><House weight="bold" size={16} />{t('teacherNav.home')}</NavLink>
        <NavLink to="/teacher/classes" className={link}><UsersThree weight="bold" size={16} />{!TIERS[tier].hasClasses ? t('teacherNav.students') : t('teacherNav.classes')}</NavLink>
        <NavLink to="/teacher/sets" className={link}><Stack weight="bold" size={16} />{t('teacherNav.sets')}</NavLink>
        <NavLink to="/teacher/reports" className={link}><ChartBar weight="bold" size={16} />{t('teacherNav.reports')}</NavLink>
        <NavLink to="/teacher/themes" className={link}><PaintBrush weight="bold" size={16} />{t('teacherNav.themes')}</NavLink>
        <NavLink to="/teacher/achievements" className={link}><Sticker weight="bold" size={16} />{t('teacherNav.achievements')}</NavLink>
        <NavLink to="/teacher/account" className={link}><UserCircle weight="bold" size={16} />{t('teacherNav.account')}</NavLink>
        {unfinished && (
          <button type="button" aria-expanded={showing} onClick={() => setOpen(!showing)}
            className={`min-h-8 px-3 rounded-pill font-bold text-xs inline-flex flex-1 justify-center whitespace-nowrap items-center gap-1.5 border-std border-border ${showing ? 'bg-surface-2' : 'bg-butter text-text'}`}>
            <RocketLaunch weight="fill" size={16} />{t('start.pill', { done: start.count, total: start.steps.length })}
          </button>
        )}
        {survey && (
          <button type="button" onClick={() => setSurveyOpen(true)}
            className="min-h-8 px-3 rounded-pill font-bold text-xs inline-flex flex-1 justify-center whitespace-nowrap items-center gap-1.5 border-std border-border bg-secondary">
            <ChatTeardropText weight="fill" size={16} />{t('survey.pill')}
          </button>
        )}
        <TrialChip />
      </nav>
      <TrialNotes />
      {survey && surveyOpen && <TeacherSurvey id={survey} onClose={() => { setSurveyOpen(false); void surveyDue().then(setSurvey); }} />}
      {beta && !onAccount && <BetaChecklist s={beta} />}
      {unfinished && showing && <GetStarted steps={start.steps} count={start.count} onFold={() => setOpen(false)} />}
    </>
  );
}

// The class switcher at the foot of the rail (approved portal Shell): the
// class in view (or the last one opened), its student count, and Switch class,
// which opens the list. Free plans have one list, "My students".
const LAST = 'gamify-last-class';
function ClassSwitcher() {
  const path = useLocation().pathname;
  const inUrl = /^\/teacher\/classes\/([^/]+)/.exec(path)?.[1];
  useEffect(() => { if (inUrl) try { localStorage.setItem(LAST, inUrl); } catch { /* private window */ } }, [inUrl]);
  const { value } = useAsync(async () => {
    const classes = [...await data.listClassrooms()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const counts = await Promise.all(classes.map(async (c) => (await data.listStudents(c.id)).length));
    return classes.map((c, i) => ({ id: c.id, name: c.name, count: counts[i] }));
  }, [path]);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => {
    if (!open) return;
    const off = (e: PointerEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', off);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', off); document.removeEventListener('keydown', esc); };
  }, [open]);
  if (!value) return null;
  let last: string | null = null;
  try { last = localStorage.getItem(LAST); } catch { /* private window */ }
  const current = value.find((c) => c.id === inUrl) ?? value.find((c) => c.id === last) ?? value[0];
  if (!current) {
    return (
      <Link to="/teacher/classes" className="rounded-input p-3 grid gap-0.5 text-sm font-semibold bg-cream no-underline text-text hover:bg-surface-2">
        <b>{t('teacherNav.noClass')}</b>
        <span className="font-bold inline-flex items-center gap-1 text-grape-deep">{t('teacherHome.addClass')}<ArrowRight weight="bold" size={13} /></span>
      </Link>
    );
  }
  return (
    <div ref={box} className="relative">
      {open && value.length > 0 && (
        <ul aria-label={t('teacherNav.classes')} className="absolute bottom-full left-0 right-0 mb-2 list-none m-0 p-1.5 grid gap-1 max-h-64 overflow-y-auto rounded-input bg-surface border-std border-border shadow-[var(--shadow-sticker)]">
          {value.map((c) => (
            <li key={c.id}>
              <Link to={`/teacher/classes/${c.id}`} aria-current={c.id === current.id ? 'true' : undefined}
                className={`min-h-11 px-3 rounded-input flex flex-col justify-center no-underline text-text text-sm ${c.id === current.id ? 'bg-butter' : 'hover:bg-surface-2'}`}>
                <b className="truncate">{c.name}</b><span className="text-muted font-semibold">{t('classes.cardCount', { count: c.count })}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="rounded-input p-3 grid gap-0.5 text-sm font-semibold bg-cream">
        <Link to={`/teacher/classes/${current.id}`} className="font-bold truncate no-underline text-text hover:underline">{current.name}</Link>
        <span className="rail-class-count text-muted">{t('classes.cardCount', { count: current.count })}</span>
        {value.length > 1
          ? <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="justify-self-start min-h-8 -ml-1 px-1 rounded-input font-bold inline-flex items-center gap-1 text-grape-deep hover:bg-surface-2">
              {t('teacherNav.switchClass')}{open ? <CaretUp weight="bold" size={13} /> : <ArrowRight weight="bold" size={13} />}
            </button>
          : <Link to="/teacher/classes" className="justify-self-start font-bold inline-flex items-center gap-1 text-grape-deep no-underline hover:underline">{t('teacherNav.allClasses')}<ArrowRight weight="bold" size={13} /></Link>}
      </div>
    </div>
  );
}
