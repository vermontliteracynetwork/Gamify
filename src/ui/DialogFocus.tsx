import { useEffect, useRef } from 'react';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Put first inside any pop-up box (role="dialog") for keyboard and screen
// reader care (WCAG 2.4.3, 2.1.2): focus moves into the box when it opens,
// Tab stays inside it, Escape closes it when it can be closed, and focus
// goes back where it was afterward.
export default function DialogFocus({ onClose }: { onClose?: () => void }) {
  const ref = useRef<HTMLSpanElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const box = ref.current?.parentElement;
    if (!box) return;
    const before = document.activeElement as HTMLElement | null;
    const items = () => [...box.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.getClientRects().length > 0);
    if (!box.contains(document.activeElement)) {
      const first = box.querySelector<HTMLElement>('[autofocus]') ?? items()[0];
      if (first) first.focus({ preventScroll: true });
      else { box.tabIndex = -1; box.focus({ preventScroll: true }); }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && close.current) { e.stopPropagation(); close.current(); return; }
      if (e.key !== 'Tab') return;
      const list = items();
      if (!list.length) { e.preventDefault(); return; }
      const first = list[0], last = list[list.length - 1], at = document.activeElement;
      if (e.shiftKey && (at === first || !box!.contains(at))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (at === last || !box!.contains(at))) { e.preventDefault(); first.focus(); }
    }
    box.addEventListener('keydown', onKey);
    return () => {
      box.removeEventListener('keydown', onKey);
      if (before && before !== document.body && document.contains(before)) before.focus({ preventScroll: true });
    };
  }, []);
  return <span ref={ref} hidden />;
}
