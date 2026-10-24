import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { DotsSixVertical, X } from '@phosphor-icons/react';

let topZ = 60;

// A small card that floats above everything, can be dragged by its title
// bar anywhere on the screen, and closes with its X. The game and question
// underneath stay usable while it's open (tools, teacher request
// 2026-10-24).
export default function FloatingCard({ title, icon, onClose, start, closeLabel, children }: {
  title: string; icon?: ReactNode; onClose: () => void; start: { x: number; y: number }; closeLabel: string; children: ReactNode;
}) {
  const [pos, setPos] = useState(start);
  const [z, setZ] = useState(() => ++topZ);
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ dx: number; dy: number } | null>(null);

  // Keep the card on screen when the window changes size.
  useEffect(() => {
    const fit = () => setPos((p) => clamp(p, ref.current));
    window.addEventListener('resize', fit);
    fit();
    return () => window.removeEventListener('resize', fit);
  }, []);

  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-label={title}
      onPointerDown={() => setZ(++topZ)}
      className="fixed bg-surface border-[2.5px] border-border rounded-panel max-w-[calc(100vw-16px)]"
      style={{ left: pos.x, top: pos.y, zIndex: z, boxShadow: 'var(--shadow-sticker-lg)' }}
    >
      <div
        className="flex items-center gap-2 pl-2 pr-1.5 py-1.5 border-b-[2px] border-border-soft cursor-grab active:cursor-grabbing touch-none select-none"
        onPointerDown={(e) => {
          drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => { if (drag.current) setPos(clamp({ x: e.clientX - drag.current.dx, y: e.clientY - drag.current.dy }, ref.current)); }}
        onPointerUp={() => { drag.current = null; }}
      >
        <DotsSixVertical weight="bold" size={20} aria-hidden="true" />
        {icon}
        <span className="font-bold flex-1">{title}</span>
        <button type="button" onClick={onClose} onPointerDown={(e) => e.stopPropagation()} aria-label={closeLabel}
          className="w-10 h-10 rounded-full border-[2px] border-border bg-surface-2 flex items-center justify-center">
          <X weight="bold" size={18} />
        </button>
      </div>
      <div className="p-3">{children}</div>
    </div>,
    document.body,
  );
}

function clamp(p: { x: number; y: number }, el: HTMLElement | null) {
  const w = el?.offsetWidth ?? 300, h = el?.offsetHeight ?? 200;
  return { x: Math.min(Math.max(8, p.x), Math.max(8, window.innerWidth - w - 8)), y: Math.min(Math.max(8, p.y), Math.max(8, window.innerHeight - Math.min(h, 120))) };
}
