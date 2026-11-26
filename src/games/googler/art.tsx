import { useEffect, useRef } from 'react';
import { motion, motionValue, useSpring, useTransform } from 'motion/react';
import { SHAPES } from './googler';

// Googler's Classic art (teacher, 2026-11-26: "use the crayon design and
// gamify new direction colors"): each unit is a chunky square in its shape's
// bright, flat and solid, with a slightly wobbly ink outline and one white
// shine at the top left (classic-art skill). Drawn in code, no files.

export const INK = '#1d1a33';
// Four wobble outlines, so neighboring units never look stamped.
const WOBBLE = [
  'M12 9 Q50 6 89 10 Q93 50 90 90 Q50 94 10 89 Q7 50 12 9 Z',
  'M10 11 Q51 8 90 9 Q92 51 89 89 Q49 93 11 90 Q8 49 10 11 Z',
  'M11 10 Q49 7 88 11 Q93 49 91 89 Q51 92 10 90 Q7 51 11 10 Z',
  'M9 10 Q50 8 90 11 Q91 50 90 91 Q50 92 11 89 Q8 50 9 10 Z',
];

export function CrayonBlock({ shape, seed = 0, className, style }: { shape: number; seed?: number; className?: string; style?: React.CSSProperties }) {
  const color = SHAPES[shape]?.color ?? '#7a88fe';
  return (
    <svg viewBox="0 0 100 100" className={className} style={style} aria-hidden="true" overflow="visible">
      <path d={WOBBLE[seed % 4]} fill={color} stroke={INK} strokeWidth="6" strokeLinejoin="round" />
      {/* An inner bevel line in the same ink, thinner, like a felt-tip doodle. */}
      <path d="M24 76 Q50 79 77 75" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.28" />
      <path d="M22 34 Q24 22 36 21" stroke="#fff" strokeWidth="7" fill="none" strokeLinecap="round" />
    </svg>
  );
}

// The five Kenney googly eyes (CC0, supplied by the teacher 2026-11-26),
// whole, for still pictures (covers, previews).
export const EYES = ['a', 'b', 'c', 'd', 'e'].map((k) => `/classic/googler/googly-${k}.png`);
// The same pack's layers (white, pupil, shine), so the pupil can move.
const PART = (n: string) => `/classic/googler/eye-${n}.webp`;

// One pointer for every eye on the page (teacher, 2026-11-26: "googly eyes
// should move toward where the cursor is at all times ... all the eyes, even
// inventory bar should react to the cursor"). Touch moves count too.
const px = motionValue(typeof window === 'undefined' ? 0 : window.innerWidth / 2);
const py = motionValue(typeof window === 'undefined' ? 0 : window.innerHeight / 3);
let listening = false;
function listen() {
  if (listening || typeof window === 'undefined') return;
  listening = true;
  const on = (e: PointerEvent) => { px.set(e.clientX); py.set(e.clientY); };
  window.addEventListener('pointermove', on, { passive: true });
  window.addEventListener('pointerdown', on, { passive: true });
}

// A googly eye whose pupil rolls toward the pointer with a loose, wobbly
// spring (it overshoots and jiggles, like a real one). `eye` varies the pupil a little.
export function GooglyEye({ eye = 0, still = false, className = '' }: { eye?: number; seed?: number; still?: boolean; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(listen, []);
  const toward = (axis: 0 | 1) => ([x, y]: number[]) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r || !r.width) return 0;
    const dx = x - (r.left + r.width / 2), dy = y - (r.top + r.height / 2);
    const d = Math.hypot(dx, dy) || 1;
    // The pupil travels to the rim of the white (a fifth of the eye), less when the pointer is close.
    const reach = Math.min(1, d / (r.width * 1.5)) * 15;
    return ((axis === 0 ? dx : dy) / d) * reach;
  };
  const tx = useTransform([px, py], toward(0));
  const ty = useTransform([px, py], toward(1));
  const sx = useSpring(tx, { stiffness: 260, damping: still ? 40 : 7, mass: 0.6 });
  const sy = useSpring(ty, { stiffness: 260, damping: still ? 40 : 7, mass: 0.6 });
  const pupil = 0.56 + (eye % 5) * 0.025;
  return (
    <span ref={ref} className={`relative inline-block aspect-square pointer-events-none select-none ${className}`} aria-hidden="true">
      <img src={PART('white')} alt="" draggable={false} className="absolute inset-0 w-full h-full" />
      <motion.img src={PART('pupil')} alt="" draggable={false} className="absolute inset-0 w-full h-full" style={{ x: useTransform(sx, (v) => `${v}%`), y: useTransform(sy, (v) => `${v}%`), scale: pupil / 0.56 }} />
      <img src={PART('shine')} alt="" draggable={false} className="absolute inset-0 w-full h-full" />
    </span>
  );
}
