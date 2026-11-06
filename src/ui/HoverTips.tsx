import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// Hover text for anything with data-tip, drawn on the very top layer so no
// box, card or game screen can cut it off (teacher, 2026-11-01: "ALWAYS show
// hover text as top layer so nothing gets cut off"). It sits above the item,
// or below when there is no room, and always stays inside the window. Long
// text wraps. Mouse hover and keyboard focus show it; touch does not.
export default function HoverTips() {
  const [tip, setTip] = useState<{ text: string; el: HTMLElement } | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const find = (t: EventTarget | null) => (t instanceof Element ? (t.closest('[data-tip]') as HTMLElement | null) : null);
    const over = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const el = find(e.target);
      setTip((cur) => (el ? (cur?.el === el ? cur : { text: el.dataset.tip ?? '', el }) : null));
    };
    const focus = (e: FocusEvent) => {
      const el = find(e.target);
      if (el && el.matches(':focus-visible')) setTip({ text: el.dataset.tip ?? '', el });
    };
    const hide = () => setTip(null);
    document.addEventListener('pointerover', over);
    document.addEventListener('focusin', focus);
    document.addEventListener('focusout', hide);
    document.addEventListener('pointerdown', hide);
    window.addEventListener('scroll', hide, true);
    return () => {
      document.removeEventListener('pointerover', over);
      document.removeEventListener('focusin', focus);
      document.removeEventListener('focusout', hide);
      document.removeEventListener('pointerdown', hide);
      window.removeEventListener('scroll', hide, true);
    };
  }, []);

  // Hide when the item goes away or its text changes.
  useEffect(() => {
    if (!tip) return;
    const id = window.setInterval(() => { if (!tip.el.isConnected || !tip.el.dataset.tip) setTip(null); }, 400);
    return () => window.clearInterval(id);
  }, [tip]);

  useLayoutEffect(() => {
    if (!tip || !box.current) { setPos(null); return; }
    const r = tip.el.getBoundingClientRect(), b = box.current.getBoundingClientRect();
    const vw = window.innerWidth, vh = window.innerHeight, pad = 8;
    let top = r.top - b.height - 8;
    if (top < pad) top = Math.min(vh - b.height - pad, r.bottom + 8);
    const left = Math.max(pad, Math.min(vw - b.width - pad, r.left + r.width / 2 - b.width / 2));
    setPos({ left, top });
  }, [tip]);

  if (!tip?.text) return null;
  // In full screen, only the full-screen element is drawn, so the tip goes there.
  const host = (document.fullscreenElement as HTMLElement | null) ?? document.body;
  return createPortal(
    // data-tip-bg colors a tip to match its button (a way to play, 2026-11-06).
    <div ref={box} role="tooltip" className={`fixed pointer-events-none max-w-[min(22rem,calc(100vw-1rem))] px-2.5 py-1 rounded-[0.9rem] text-center ${tip.el.dataset.tipBg ? 'border-[2px] border-border' : 'text-white'}`}
      style={{ left: pos?.left ?? -9999, top: pos?.top ?? -9999, zIndex: 2147483000, background: tip.el.dataset.tipBg ?? 'var(--text)', color: tip.el.dataset.tipBg ? 'var(--text)' : undefined, font: '700 0.8rem/1.25 var(--font-body)', boxShadow: '0 2px 0 rgba(0,0,0,0.25)' }}>
      {tip.text}
    </div>,
    host,
  );
}
