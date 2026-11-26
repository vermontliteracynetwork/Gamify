import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, ChalkboardTeacher, Flag, HouseSimple, List, SignOut, X } from '@phosphor-icons/react';
import { setTeacher, useSignedIn } from '../auth/session';
import { t } from '../i18n';
import { TellGamify } from './TellGamify';
import { useIsOwner } from '../owner/useIsOwner';

// The teacher rail's Report button opens the same Tell Gamify box.
const REPORT_EVENT = 'gamify-open-report';
export function openReport() { window.dispatchEvent(new Event(REPORT_EVENT)); }

// The public links (approved /brand "Top bar and footer", 2026-11-25): the
// same set signed out and signed in, so a teacher's site never changes shape.
const BAR_LINKS = [
  { to: '/', key: 'public.nav.home' }, { to: '/features', key: 'public.nav.features' }, { to: '/pricing', key: 'public.nav.pricing' },
  { to: '/research', key: 'public.nav.research' }, { to: '/themes', key: 'public.nav.themes' }, { to: '/blog', key: 'public.nav.ideas' },
] as const;

// Persistent top nav on every screen, so there's always a way back to the
// game list from inside a game.
export default function NavBar() {
  const [tellOpen, setTellOpen] = useState(false);
  useEffect(() => { const f = () => setTellOpen(true); window.addEventListener(REPORT_EVENT, f); return () => window.removeEventListener(REPORT_EVENT, f); }, []);
  const path = useLocation().pathname;
  // A bigger bar on site and teacher pages (teacher, 2026-11-19: "the top bar
  // ... still too small"); game menus keep the shorter bar so they never scroll.
  const inGame = path.startsWith('/games/');
  const { teacher, student, any } = useSignedIn();
  const isOwner = useIsOwner();
  // Student pages (teacher, 2026-11-24: "remove login entirely from student
  // pages"): the join page, the name pick, choice boards and live lobbies show
  // just the logo, with no site links and nowhere to wander.
  // Every screen a student can reach, Eyes up here and the design studio too (2026-11-24).
  const studentPage = /^\/(join|choose|live|mirror|look-up|arcade)(\/|$)/.test(path);
  // Students (and anyone inside a game without a teacher signed in) get the
  // student form; teachers and site visitors get the adult one with Help.
  const role = student || studentPage || (inGame && !teacher) ? 'student' : 'teacher';
  // Top bar buttons sit smaller than the bar with room around them (owner, 2026-11-25).
  const pill = `hover-pop flex items-center gap-1.5 whitespace-nowrap text-sm font-bold text-text no-underline px-3 ${inGame ? 'min-h-8' : 'min-h-9'} rounded-pill border-std border-border bg-white hover:bg-surface-hover transition-colors`;
  // The current page wears Butter (New direction rule 10, approved 2026-11-25).
  // The page you are on is shown by bold text only: no highlight, no underline (owner 2026-11-26).
  const navLink = (to: string) => `flex min-h-9 px-3 items-center rounded-pill text-sm no-underline text-text ${path === to ? 'font-bold' : 'nav-grow font-medium'}`;
  // Student pages and signed-in students: the logo only, nothing to wander to.
  const logoOnly = studentPage || (!!student && !teacher);
  const reportBtn = (cls = '') => (
    <button type="button" onClick={() => setTellOpen(true)} aria-label={t('report.open')} title={t('report.open')}
      className={`${inGame ? 'w-8 h-8' : 'w-9 h-9'} rounded-full border-std border-border bg-white hover:bg-surface-hover flex items-center justify-center shrink-0 ${cls}`}>
      <Flag weight="bold" size={18} />
    </button>
  );
  return (
    <header className={`site-header no-print sticky top-0 z-50 ${inGame ? 'h-12' : 'h-14'} flex items-center gap-2 px-4 sm:px-6 bg-white border-b-[2.5px] border-border`}>
      {/* The logo always opens the Gamify home page (owner, 2026-11-26); student pages still show nothing else. */}
      <Link to="/" className="flex items-center min-h-11 shrink-0 active:scale-95 motion-safe:transition-transform mr-auto" aria-label={t('nav.home')}>
        <img src="/brand/gamify-wordmark.png" alt="Gamify" className="h-7 sm:h-8 w-auto shrink-0" draggable="false" />
      </Link>
      {!any && !studentPage && (
        <nav aria-label={t('public.nav.label')} className="hidden lg:flex items-center gap-1">
          {BAR_LINKS.map(({ to, key }) => <Link key={to} to={to} aria-current={path === to ? 'page' : undefined} className={navLink(to)}>{t(key)}</Link>)}
          <Link to="/join" className={`${pill} !bg-accent`}>{t('public.nav.join')}</Link>
          <Link to="/login" className={`${pill} !bg-lavender`}>{t('public.nav.login')}</Link>
        </nav>
      )}
      {/* Phones (rule 10): Log in beside one 44px menu that holds every link and Report. */}
      {!any && !studentPage && path !== '/login' && <Link to="/login" className={`${pill} !bg-lavender lg:hidden`}>{t('public.nav.login')}</Link>}
      {!any && !studentPage && <MobileMenu path={path} onReport={() => setTellOpen(true)} />}
      {/* Report, for everyone on every page (owner, 2026-11-24); student pages show the logo only (rule 10). */}
      {!logoOnly && reportBtn(teacher ? 'hidden md:flex' : !any ? 'hidden lg:flex' : '')}
      {any && teacher && !studentPage && (
        <>
          {/* Teachers keep a way to the public site: home, features, the blog
              and help (teacher, 2026-10-31). Students never see these. */}
          {/* Not inside a game (teacher, 2026-11-18): just the buttons on the right. */}
          {!student && !path.startsWith('/games/') && (
            <nav aria-label={t('public.nav.label')} className="hidden xl:flex items-center gap-1 mr-1">
              {BAR_LINKS.map(({ to, key }) => <Link key={to} to={to} aria-current={path === to ? 'page' : undefined} className={navLink(to)}>{t(key)}</Link>)}
            </nav>
          )}

          {/* Only the owner's own account ever sees this (teacher, 2026-11-23); it opens the developer dashboard. */}
          {isOwner && !student && <Link to="/owner" className={`${pill} !bg-danger !text-text hover:!bg-blush hidden md:flex`}>{t('nav.devPortal')}</Link>}
          <Link to="/teacher" className={`${pill} hidden md:flex`}><ChalkboardTeacher weight="bold" size={15} />{t('nav.teacher')}</Link>
          {!student && <Link to="/play" className={`${pill} hidden md:flex`}><HouseSimple weight="bold" size={16} />{t('nav.allGames')}</Link>}
          {!student && <button type="button" onClick={() => setTeacher(null)} className={`${pill} hidden md:flex`}><SignOut weight="bold" size={16} />{t('nav.logOut')}</button>}
          <TeacherMenu path={path} owner={isOwner && !student} student={!!student} wide={!inGame && !student} onReport={() => setTellOpen(true)} />
        </>
      )}
      <TellDialog open={tellOpen} role={role} onClose={() => setTellOpen(false)} />
    </header>
  );
}

function TellDialog({ open, role, onClose }: { open: boolean; role: 'teacher' | 'student'; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (open && d && !d.open) d.showModal();
    if (!open && d?.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} onClose={onClose} aria-label={t('tell.title')}
      className="m-auto w-[min(560px,calc(100vw-32px))] rounded-panel border-bold border-border bg-surface p-4 backdrop:bg-black/40">
      <div className="flex justify-end mb-2">
        <button type="button" onClick={onClose} aria-label={t('tell.close')} className="w-11 h-11 rounded-full border-std border-border bg-white flex items-center justify-center">
          <X weight="bold" size={20} />
        </button>
      </div>
      {open && <TellGamify role={role} />}
    </dialog>
  );
}

// Phones (teacher, 2026-11-24: "phone sizing mobile site needs a great deal of
// improvement"): the logo and one Menu button that opens a full-screen sheet
// of big links. A modal dialog keeps focus inside, Escape closes it, and
// focus goes back to the Menu button.
const SHEET_LINKS = [
  { to: '/', key: 'public.nav.home' }, { to: '/features', key: 'public.nav.features' }, { to: '/pricing', key: 'public.nav.pricing' },
  { to: '/themes', key: 'public.nav.themes' }, { to: '/research', key: 'public.nav.research' }, { to: '/blog', key: 'public.nav.ideas' },
  { to: '/schools', key: 'public.nav.schools' }, { to: '/homeschool', key: 'public.nav.homeschool' }, { to: '/help', key: 'public.nav.help' },
] as const;

function MobileMenu({ path, onReport }: { path: string; onReport: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (open && d && !d.open) d.showModal();
    if (!open && d?.open) d.close();
    document.documentElement.style.overflow = open ? 'hidden' : '';
  }, [open]);
  // A tap on a link changes the page: close the sheet.
  useEffect(() => { setOpen(false); }, [path]);
  const close = () => setOpen(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open} aria-label={t('public.nav.menu')}
        className="lg:hidden shrink-0 w-9 h-9 rounded-full grid place-items-center border-std border-border bg-white active:scale-95">
        <List weight="bold" size={22} aria-hidden="true" />
      </button>
      <dialog ref={ref} onClose={close} aria-label={t('public.nav.label')}
        className="lg:hidden m-0 p-0 w-screen max-w-none h-dvh max-h-none bg-bg text-text border-0 backdrop:bg-black/40">
        <div className="min-h-full flex flex-col">
          <div className="h-14 shrink-0 flex items-center px-4 bg-surface border-b-[2.5px] border-border">
            <img src="/brand/gamify-wordmark.png" alt="Gamify" className="h-7 w-auto mr-auto" draggable="false" />
            <button type="button" onClick={close} aria-label={t('public.nav.closeMenu')} autoFocus
              className="w-11 h-11 rounded-full border-std border-border bg-white flex items-center justify-center active:scale-95">
              <X weight="bold" size={22} />
            </button>
          </div>
          <nav aria-label={t('public.nav.label')} className="px-4 py-4 grid gap-2">
            {SHEET_LINKS.map(({ to, key }) => (
              <Link key={to} to={to} onClick={close} aria-current={path === to ? 'page' : undefined}
                className={`flex items-center justify-between min-h-14 px-5 rounded-panel border-bold border-border text-xl no-underline text-text bg-surface ${path === to ? 'font-bold' : 'font-medium'}`}>
                {t(key)}<ArrowRight weight="bold" size={20} aria-hidden="true" />
              </Link>
            ))}
          </nav>
          <div className="mt-auto px-4 pb-6 pt-2 grid grid-cols-2 gap-3">
            <button type="button" onClick={() => { close(); onReport(); }} className="col-span-2 flex items-center justify-center gap-2 min-h-12 rounded-pill border-std border-border bg-white font-bold text-base"><Flag weight="bold" size={20} aria-hidden="true" />{t('report.open')}</button>
            <Link to="/join" onClick={close} className="flex items-center justify-center min-h-14 rounded-pill border-bold border-border bg-accent font-bold text-lg no-underline text-text" style={{ boxShadow: 'var(--shadow-sticker)' }}>{t('public.nav.join')}</Link>
            <Link to="/login" onClick={close} className="flex items-center justify-center gap-2 min-h-14 rounded-pill border-bold border-border bg-lavender font-bold text-lg no-underline text-text">{t('public.nav.login')}</Link>
          </div>
        </div>
      </dialog>
    </>
  );
}

// Signed-in teachers on phones (rule 10): Teacher, All games, the site links,
// Report and Log out fold into the same one 44px menu.
// Signed-in teachers on iPads and small laptops (below 1280) keep the site
// links in this menu too, beside Teacher, All games and Log out (`wide`).
function TeacherMenu({ path, owner, student, wide, onReport }: { path: string; owner: boolean; student: boolean; wide: boolean; onReport: () => void }) {
  const hide = wide ? 'xl:hidden' : 'md:hidden';
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (open && d && !d.open) d.showModal();
    if (!open && d?.open) d.close();
    document.documentElement.style.overflow = open ? 'hidden' : '';
  }, [open]);
  useEffect(() => { setOpen(false); }, [path]);
  const close = () => setOpen(false);
  const links: { to: string; label: string }[] = [
    { to: '/teacher', label: t('nav.teacher') },
    ...(student ? [] : [{ to: '/play', label: t('nav.allGames') }]),
    ...(owner ? [{ to: '/owner', label: t('nav.devPortal') }] : []),
    ...BAR_LINKS.map(({ to, key }) => ({ to, label: t(key) })), { to: '/help', label: t('public.nav.help') },
  ];
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open} aria-label={t('public.nav.menu')}
        className={`${hide} shrink-0 w-9 h-9 rounded-full grid place-items-center border-std border-border bg-white active:scale-95`}>
        <List weight="bold" size={22} aria-hidden="true" />
      </button>
      <dialog ref={ref} onClose={close} aria-label={t('public.nav.label')}
        className={`${hide} m-0 p-0 w-screen max-w-none h-dvh max-h-none bg-bg text-text border-0 backdrop:bg-black/40`}>
        <div className="min-h-full flex flex-col">
          <div className="h-14 shrink-0 flex items-center px-4 bg-white border-b-[2.5px] border-border">
            <img src="/brand/gamify-wordmark.png" alt="Gamify" className="h-7 w-auto mr-auto" draggable="false" />
            <button type="button" onClick={close} aria-label={t('public.nav.closeMenu')} autoFocus
              className="w-11 h-11 rounded-full border-std border-border bg-white flex items-center justify-center active:scale-95">
              <X weight="bold" size={22} />
            </button>
          </div>
          <nav aria-label={t('public.nav.label')} className="px-4 py-4 grid gap-2">
            {links.map(({ to, label }) => (
              <Link key={to} to={to} onClick={close} aria-current={path === to ? 'page' : undefined}
                className={`flex items-center justify-between min-h-14 px-5 rounded-panel border-bold border-border text-xl no-underline text-text bg-surface ${path === to ? 'font-bold' : 'font-medium'}`}>
                {label}<ArrowRight weight="bold" size={20} aria-hidden="true" />
              </Link>
            ))}
          </nav>
          <div className="mt-auto px-4 pb-6 pt-2 grid gap-3">
            <button type="button" onClick={() => { close(); onReport(); }} className="flex items-center justify-center gap-2 min-h-12 rounded-pill border-std border-border bg-white font-bold text-base"><Flag weight="bold" size={20} aria-hidden="true" />{t('report.open')}</button>
            {!student && <button type="button" onClick={() => { close(); setTeacher(null); }} className="flex items-center justify-center gap-2 min-h-14 rounded-pill border-bold border-border bg-white font-bold text-lg"><SignOut weight="bold" size={20} aria-hidden="true" />{t('nav.logOut')}</button>}
          </div>
        </div>
      </dialog>
    </>
  );
}
