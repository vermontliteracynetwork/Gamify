import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, ChalkboardTeacher, Flag, HouseSimple, List, SignOut, X } from '@phosphor-icons/react';
import { setTeacher, useSignedIn } from '../auth/session';
import { t } from '../i18n';
import { TellGamify } from './TellGamify';
import { useIsOwner } from '../owner/useIsOwner';

// Persistent top nav on every screen, so there's always a way back to the
// game list from inside a game.
export default function NavBar() {
  const [tellOpen, setTellOpen] = useState(false);
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
  const pill = 'hover-pop flex items-center gap-1.5 whitespace-nowrap text-sm sm:text-base font-bold text-text no-underline px-3.5 min-h-10 tap rounded-pill border-std border-border bg-surface-2 hover:bg-secondary transition-colors';
  return (
    <header className={`site-header no-print sticky top-0 z-50 ${inGame ? 'h-12' : 'h-14'} flex items-center gap-2 px-4 sm:px-6 bg-white border-b-[2.5px] border-border`}>
      {studentPage && !any
        ? <span className="flex items-center shrink-0 mr-auto"><img src="/brand/gamify-wordmark.png" alt="Gamify" className="h-7 sm:h-8 w-auto shrink-0" draggable="false" /></span>
        : <Link to={any ? '/play' : '/'} className="flex items-center min-h-11 shrink-0 active:scale-95 motion-safe:transition-transform mr-auto" aria-label={t('nav.home')}>
            <img src="/brand/gamify-wordmark.png" alt="Gamify" className="h-7 sm:h-8 w-auto shrink-0" draggable="false" />
          </Link>}
      {!any && !studentPage && <MobileMenu path={path} />}
      {!any && !studentPage && (
        <nav aria-label={t('public.nav.label')} className="hidden md:flex items-center gap-1 sm:gap-2">
          <Link to="/" aria-current={path === '/' ? 'page' : undefined} className="nav-grow flex min-h-10 tap px-3 items-center font-bold text-base no-underline text-text">{t('public.nav.home')}</Link>
          <Link to="/features" className="nav-grow flex min-h-10 tap px-3 items-center font-bold text-base no-underline text-text">{t('public.nav.features')}</Link>
          <Link to="/pricing" className="nav-grow flex min-h-10 tap px-3 items-center font-bold text-base no-underline text-text">{t('public.nav.pricing')}</Link>
          <Link to="/research" className="nav-grow flex min-h-10 tap px-3 items-center font-bold text-base no-underline text-text">{t('public.nav.research')}</Link>
          <Link to="/blog" className="nav-grow flex min-h-10 tap px-3 items-center font-bold text-base no-underline text-text">{t('public.nav.ideas')}</Link>
          <Link to="/join" className={pill}>{t('public.nav.join')}</Link>
          <Link to="/login" className={`${pill} !bg-accent`}><ChalkboardTeacher weight="bold" size={16} />{t('public.nav.login')}</Link>
        </nav>
      )}
      {/* Report, for everyone on every page (owner, 2026-11-24). */}
      <button type="button" onClick={() => setTellOpen(true)} aria-label={t('report.open')} title={t('report.open')}
        className="w-9 h-9 tap-round rounded-full border-std border-border bg-surface-2 hover:bg-secondary flex items-center justify-center shrink-0">
        <Flag weight="bold" size={18} />
      </button>
      {any && (
        <>
          {/* Teachers keep a way to the public site: home, features, the blog
              and help (teacher, 2026-10-31). Students never see these. */}
          {/* Not inside a game (teacher, 2026-11-18): just the buttons on the right. */}
          {teacher && !student && !path.startsWith('/games/') && (
            <nav aria-label={t('public.nav.label')} className="hidden lg:flex items-center gap-1 mr-1">
              <Link to="/" className="nav-grow flex min-h-10 tap px-3 items-center font-bold text-base no-underline text-text">{t('public.nav.home')}</Link>
              <Link to="/features" className="nav-grow flex min-h-10 tap px-3 items-center font-bold text-base no-underline text-text">{t('public.nav.features')}</Link>
              <Link to="/blog" className="nav-grow flex min-h-10 tap px-3 items-center font-bold text-base no-underline text-text">{t('public.nav.ideas')}</Link>
              <Link to="/help" className="nav-grow flex min-h-10 tap px-3 items-center font-bold text-base no-underline text-text">{t('public.nav.faq')}</Link>
            </nav>
          )}

          {/* Only the owner's own account ever sees this (teacher, 2026-11-23); it opens the developer dashboard. */}
          {isOwner && !student && <Link to="/owner" className={`${pill} !bg-danger !text-white hover:!bg-error`}>{t('nav.devPortal')}</Link>}
          {teacher && <Link to="/teacher" className={pill}><ChalkboardTeacher weight="bold" size={16} /><span className="max-[420px]:sr-only">{t('nav.teacher')}</span></Link>}
          {!student && <Link to="/play" className={pill}><HouseSimple weight="bold" size={16} /><span className="max-[420px]:sr-only">{t('nav.allGames')}</span></Link>}
          {teacher && !student && <button type="button" onClick={() => setTeacher(null)} className={`${pill} hidden sm:flex`}><SignOut weight="bold" size={16} />{t('nav.logOut')}</button>}
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
        <button type="button" onClick={onClose} aria-label={t('tell.close')} className="w-11 h-11 rounded-full border-std border-border bg-surface-2 flex items-center justify-center">
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
  { to: '/schools', key: 'public.nav.schools' }, { to: '/homeschool', key: 'public.nav.homeschool' }, { to: '/help', key: 'public.nav.faq' },
] as const;

function MobileMenu({ path }: { path: string }) {
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
      <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open}
        className="md:hidden flex items-center gap-2 min-h-11 px-4 rounded-pill border-std border-border bg-surface-2 font-bold text-base active:scale-95">
        <List weight="bold" size={22} aria-hidden="true" />{t('public.nav.menu')}
      </button>
      <dialog ref={ref} onClose={close} aria-label={t('public.nav.label')}
        className="md:hidden m-0 p-0 w-screen max-w-none h-dvh max-h-none bg-bg text-text border-0 backdrop:bg-black/40">
        <div className="min-h-full flex flex-col">
          <div className="h-14 shrink-0 flex items-center px-4 bg-surface border-b-[2.5px] border-border">
            <img src="/brand/gamify-wordmark.png" alt="Gamify" className="h-7 w-auto mr-auto" draggable="false" />
            <button type="button" onClick={close} aria-label={t('public.nav.closeMenu')} autoFocus
              className="w-11 h-11 rounded-full border-std border-border bg-surface-2 flex items-center justify-center active:scale-95">
              <X weight="bold" size={22} />
            </button>
          </div>
          <nav aria-label={t('public.nav.label')} className="px-4 py-4 grid gap-2">
            {SHEET_LINKS.map(({ to, key }) => (
              <Link key={to} to={to} onClick={close} aria-current={path === to ? 'page' : undefined}
                className={`flex items-center justify-between min-h-14 px-5 rounded-panel border-bold border-border font-bold text-xl no-underline text-text ${path === to ? 'bg-accent' : 'bg-surface'}`}>
                {t(key)}<ArrowRight weight="bold" size={20} aria-hidden="true" />
              </Link>
            ))}
          </nav>
          <div className="mt-auto px-4 pb-6 pt-2 grid grid-cols-2 gap-3">
            <Link to="/join" onClick={close} className="flex items-center justify-center min-h-14 rounded-pill border-bold border-border bg-surface-2 font-bold text-lg no-underline text-text">{t('public.nav.join')}</Link>
            <Link to="/login" onClick={close} className="flex items-center justify-center gap-2 min-h-14 rounded-pill border-bold border-border bg-accent font-bold text-lg no-underline text-text" style={{ boxShadow: 'var(--shadow-sticker)' }}><ChalkboardTeacher weight="bold" size={20} />{t('public.nav.login')}</Link>
          </div>
        </div>
      </dialog>
    </>
  );
}
