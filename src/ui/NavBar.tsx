import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChalkboardTeacher, ChatCircleDots, HouseSimple, X } from '@phosphor-icons/react';
import { t } from '../i18n';
import { TellGamify } from './TellGamify';

// Persistent top nav on every screen, so there's always a way back to the
// game list from inside a game.
export default function NavBar() {
  const [tellOpen, setTellOpen] = useState(false);
  const role = useLocation().pathname.startsWith('/teacher') ? 'teacher' : 'student';
  return (
    <header className="sticky top-0 z-50 h-16 flex items-center px-4 sm:px-6 bg-surface border-b-[2.5px] border-border">
      <Link to="/" className="flex items-center active:scale-95 motion-safe:transition-transform" aria-label={t('nav.home')}>
        <img src="/brand/gamify-wordmark.png" alt="Gamify" className="h-9 w-auto" draggable="false" />
      </Link>
      <button
        type="button"
        onClick={() => setTellOpen(true)}
        aria-label={t('tell.open')}
        className="ml-auto mr-2 w-11 h-11 rounded-full border-[2px] border-border bg-surface-2 hover:bg-secondary flex items-center justify-center"
      >
        <ChatCircleDots weight="bold" size={22} />
      </button>
      <TellDialog open={tellOpen} role={role} onClose={() => setTellOpen(false)} />
      <Link
        to="/teacher"
        className="mr-2 flex items-center gap-1.5 text-sm font-bold text-text no-underline px-3.5 min-h-11 rounded-pill
                   border-[2px] border-border bg-surface-2 hover:bg-secondary transition-colors"
      >
        <ChalkboardTeacher weight="bold" size={16} />
        {t('nav.teacher')}
      </Link>
      <Link
        to="/"
        className="flex items-center gap-1.5 text-sm font-bold text-text hover:text-accent-ink no-underline px-3.5 min-h-11 rounded-pill
                   border-[2px] border-border bg-surface-2 hover:bg-secondary transition-colors"
      >
        <HouseSimple weight="bold" size={16} />
        {t('nav.allGames')}
      </Link>
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
