import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { SignOut, X } from '@phosphor-icons/react';
import { useTeacher } from '../auth/session';
import { useSession } from '../student/session';
import { t } from '../i18n';
import { useSettings } from '../settings/SettingsContext';
import { playEffect } from './feedback';
import Dialog from '../ui/Dialog';
import { Button } from '../ui/kit';

// The fourth tool, Close (Brand Kit order 2026-11-24: Hint, Settings, Full
// screen, Close). It always asks first, so a stray tap never ends a class
// game; a teacher goes back to Pick a game, a student to the join page.
export default function CloseGameButton() {
  const [ask, setAsk] = useState(false);
  const navigate = useNavigate();
  const teacher = useTeacher();
  const session = useSession();
  const { settings } = useSettings();
  const leave = () => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    navigate(teacher && !session ? '/play' : '/join');
  };
  return (
    <>
      <button type="button" onClick={() => { playEffect('open', settings); setAsk(true); }} aria-label={t('game.close')} title={t('game.close')}
        className="tool-round w-11 h-11 shrink-0 rounded-full border-border flex items-center justify-center active:scale-95 motion-safe:transition">
        <X weight="bold" size={20} />
      </button>
      {ask && createPortal(
        <Dialog title={t('game.closeTitle')} sub={t('game.closeSub')} onClose={() => setAsk(false)} closeLabel={t('game.closeStay')} size="sm" center zIndex={80}>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="primary" onClick={() => setAsk(false)}>{t('game.closeStay')}</Button>
            <Button onClick={leave}><SignOut weight="bold" size={18} />{t('game.closeLeave')}</Button>
          </div>
        </Dialog>, document.body,
      )}
    </>
  );
}
