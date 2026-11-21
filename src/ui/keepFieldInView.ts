// The on-screen keyboard never covers the box being typed in (2026-11-21):
// when a text field gets focus and the keyboard shrinks the visible area,
// the field scrolls to the middle of what is still visible.
export function keepFieldInView() {
  const vv = window.visualViewport;
  if (!vv) return () => undefined;
  const check = () => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || !el.matches('input:not([type=checkbox]):not([type=radio]):not([type=range]), textarea, [contenteditable="true"]')) return;
    const r = el.getBoundingClientRect();
    if (r.bottom > vv.height - 8 || r.top < 0) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };
  const onFocus = () => window.setTimeout(check, 350);
  document.addEventListener('focusin', onFocus);
  vv.addEventListener('resize', check);
  return () => { document.removeEventListener('focusin', onFocus); vv.removeEventListener('resize', check); };
}
