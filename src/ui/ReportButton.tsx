import { useState } from 'react';
import { Flag } from '@phosphor-icons/react';
import { useSignedIn } from '../auth/session';
import { t } from '../i18n';
import Dialog from './Dialog';
import { TellGamify } from './TellGamify';

// The Report button (owner, 2026-11-24): "a report button on every game and in
// all places where there's a small menu of buttons, so people can have an easy
// form to report errors, recommendations, requests, feedback in general ...
// for all plans ... for everyone in every place." It sits beside the gear in
// every game and on the question screen, in the top bar, and in the results box.
// The same round button look as the gear, so it reads at a glance.
export default function ReportButton({ small = false, context, className = '' }: { small?: boolean; context?: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const { teacher, student } = useSignedIn();
  const role = teacher && !student ? 'teacher' : 'student';
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={t('report.open')} title={t('report.open')}
        className={`${small ? 'tool-round w-11 h-11' : 'w-14 h-14 bg-surface border-bold border-border'} shrink-0 rounded-full flex items-center justify-center active:scale-95 motion-safe:transition ${className}`}
        style={small ? undefined : { boxShadow: 'var(--shadow-sticker)' }}>
        <Flag weight="bold" size={small ? 20 : 28} />
      </button>
      {open && (
        <Dialog title={t('tell.title')} onClose={() => setOpen(false)} closeLabel={t('tell.close')} zIndex={70}>
          <TellGamify role={role} context={context} bare />
        </Dialog>
      )}
    </>
  );
}
