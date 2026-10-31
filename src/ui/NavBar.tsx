import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChalkboardTeacher, ChatCircleDots, HouseSimple, SignOut, X } from '@phosphor-icons/react';
import { setTeacher, useSignedIn } from '../auth/session';
import { t } from '../i18n';
import { TellGamify } from './TellGamify';

// Persistent top nav on every screen, so there's always a way back to the
// game list from inside a game.
export default function NavBar() {
  const [tellOpen, setTellOpen] = useState(false);
  const path = useLocation().pathname;
  const role = path.startsWith('/teacher') ? 'teacher' : 'student';
  const { teacher, student, any } = useSignedIn();
  const pill = 'hover-pop flex items-center gap-1.5 whitespace-nowrap text-sm font-bold text-text no-underline px-3.5 min-h-11 rounded-pill border-[2px] border-border bg-surface-2 hover:bg-secondary transition-colors';
  return (
    <header className="site-header no-print sticky top-0 z-50 h-16 flex items-center gap-2 px-4 sm:px-6 bg-surface border-b-[2.5px] border-border">
      <Link to={any ? '/play' : '/'} className="flex items-center shrink-0 active:scale-95 motion-safe:transition-transform mr-auto" aria-label={t('nav.home')}>
        <img src="/brand/gamify-wordmark.png" alt="Gamify" className="h-7 sm:h-9 w-auto shrink-0" draggable="false" />
      </Link>
      {!any && (
        <nav aria-label={t('public.nav.label')} className="flex items-center gap-1 sm:gap-2">
          <Link to="/" aria-current={path === '/' ? 'page' : undefined} className="nav-grow hidden sm:flex min-h-11 px-3 items-center font-bold text-sm no-underline text-text">{t('public.nav.home')}</Link>
          <Link to="/features" className="nav-grow hidden sm:flex min-h-11 px-3 items-center font-bold text-sm no-underline text-text">{t('public.nav.features')}</Link>
          <Link to="/pricing" className="nav-grow hidden sm:flex min-h-11 px-3 items-center font-bold text-sm no-underline text-text">{t('public.nav.pricing')}</Link>
          <Link to="/research" className="nav-grow hidden md:flex min-h-11 px-3 items-center font-bold text-sm no-underline text-text">{t('public.nav.research')}</Link>
          <Link to="/blog" className="nav-grow hidden md:flex min-h-11 px-3 items-center font-bold text-sm no-underline text-text">{t('public.nav.ideas')}</Link>
          <Link to="/join" className={pill}>{t('public.nav.join')}</Link>
          <Link to="/login" className={`${pill} !bg-accent`}><ChalkboardTeacher weight="bold" size={16} />{t('public.nav.login')}</Link>
        </nav>
      )}
      {any && (
        <>
          <button type="button" onClick={() => setTellOpen(true)} aria-label={t('tell.open')}
            className="w-11 h-11 rounded-full border-[2px] border-border bg-surface-2 hover:bg-secondary flex items-center justify-center">
            <ChatCircleDots weight="bold" size={22} />
          </button>
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
      className="m-auto w-[min(560px,calc(100vw-32px))] rounded-panel border-[2.5px] border-border bg-surface p-4 backdrop:bg-black/40">
      <div className="flex justify-end mb-2">
        <button type="button" onClick={onClose} aria-label={t('tell.close')} className="w-11 h-11 rounded-full border-[2px] border-border bg-surface-2 flex items-center justify-center">
          <X weight="bold" size={20} />
        </button>
      </div>
      {open && <TellGamify role={role} />}
    </dialog>
  );
}
