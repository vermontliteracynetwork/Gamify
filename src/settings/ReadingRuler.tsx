import { useEffect, useState } from 'react';

// A reading ruler (teacher, 2026-11-20): a clear band follows the pointer or
// finger and softly shades the rest of the screen, so one line of a question
// stands out. It never blocks a tap.
export default function ReadingRuler() {
  const [y, setY] = useState(() => window.innerHeight / 2);
  useEffect(() => {
    const move = (e: PointerEvent) => setY(e.clientY);
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerdown', move, { passive: true });
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerdown', move); };
  }, []);
  const band = 'clamp(3.5rem, 9vh, 6rem)';
  return (
    <div aria-hidden="true" className="fixed inset-0 z-[200] pointer-events-none">
      <div className="absolute inset-x-0 top-0 bg-black/45" style={{ height: `calc(${y}px - ${band} / 2)` }} />
      <div className="absolute inset-x-0 border-y-[3px] border-[#fdfd94]" style={{ top: `calc(${y}px - ${band} / 2)`, height: band, boxShadow: '0 0 0 2px #000 inset' }} />
      <div className="absolute inset-x-0 bottom-0 bg-black/45" style={{ top: `calc(${y}px + ${band} / 2)` }} />
    </div>
  );
}
