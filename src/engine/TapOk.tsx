import { useEffect, useRef } from 'react';
import { t } from '../i18n';

// The big "go on" button every game pop-up waits for (teacher, 2026-11-24:
// "require tap to close ... give the students and the teacher time to
// process"). Pale yellow with ink text, at least 56px tall, focused when it
// shows, and Enter or Space works from anywhere while it is up.
// Only the newest OK on screen answers Enter or Space.
const stack: object[] = [];

export default function TapOk({ onTap, label, className = '', keys = true }: { onTap: () => void; label?: string; className?: string; keys?: boolean }) {
  const ref = useRef<HTMLButtonElement>(null);
  const tap = useRef(onTap); tap.current = onTap;
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
    if (!keys) return;
    const me = {};
    stack.push(me);
    const onKey = (e: KeyboardEvent) => {
      if (stack[stack.length - 1] !== me) return;
      if (e.repeat || (e.key !== 'Enter' && e.key !== ' ')) return;
      const at = e.target as HTMLElement | null;
      if (at && at !== ref.current && at.closest?.('input, textarea, select, button, a')) return;
      e.preventDefault(); e.stopPropagation();
      tap.current();
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); const i = stack.indexOf(me); if (i >= 0) stack.splice(i, 1); };
  }, [keys]);
  return (
    <button ref={ref} type="button" onClick={(e) => { e.stopPropagation(); onTap(); }} autoFocus
      className={`tap-ok min-h-[3.5rem] min-w-[9rem] px-7 rounded-pill border-heavy border-border bg-accent text-accent-ink font-display font-bold text-2xl inline-flex items-center justify-center gap-2 motion-safe:hover:-translate-y-0.5 motion-safe:transition-transform focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-black ${className}`}
      style={{ boxShadow: '0 5px 0 var(--ink)' }}>
      {label ?? t('tap.ok')}
    </button>
  );
}
