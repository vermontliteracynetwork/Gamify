import { useEffect, useRef } from 'react';
import { motion, motionValue, useSpring, useTransform } from 'motion/react';
import { SHAPES } from './googler';

// Googler's Classic art (teacher, 2026-11-26: "use the crayon design and
// gamify new direction colors"): each unit is a chunky square in its shape's
// bright, flat and solid, with a slightly wobbly ink outline and one white
// shine at the top left (classic-art skill). Drawn in code, no files.

export const INK = '#1d1a33';
// Four wobble outlines, so neighboring units never look stamped.
// Pushed a few units out of true at each corner (Classic Art Director, 2026-11-26).
const WOBBLE = [
  'M13 8 Q50 4 90 11 Q95 50 88 91 Q50 96 9 88 Q5 50 13 8 Z',
  'M9 12 Q52 6 91 8 Q94 52 90 88 Q47 95 12 92 Q6 48 9 12 Z',
  'M12 9 Q48 5 87 12 Q95 48 92 90 Q52 94 8 91 Q5 52 12 9 Z',
  'M8 11 Q51 7 92 10 Q92 49 89 92 Q49 94 12 88 Q7 51 8 11 Z',
];

export function CrayonBlock({ shape, seed = 0, className, style }: { shape: number; seed?: number; className?: string; style?: React.CSSProperties }) {
  const color = SHAPES[shape]?.color ?? '#7a88fe';
  return (
    <svg viewBox="0 0 100 100" className={className} style={style} aria-hidden="true" overflow="visible">
      {/* The kit's ink weight (Wax default 4.8); one solid thin ink line low inside, no see-through layers. */}
      <path d={WOBBLE[seed % 4]} fill={color} stroke={INK} strokeWidth="4.8" strokeLinejoin="round" />
      <path d="M26 77 Q50 80 75 76" stroke={INK} strokeWidth="2.4" fill="none" strokeLinecap="round" />
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
      <EyeRing />
    </span>
  );
}

// The kit's hand-drawn ink edge around the eye white (Classic Art Director,
// 2026-11-26), so the eye sits with the rest of the Classic kit.
function EyeRing() {
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" overflow="visible" aria-hidden="true">
      <path d="M50 3.5 C76 3 97 23 96.5 50 C96 77 75 97 49 96.5 C23 96 3 76 3.5 49 C4 24 25 4 50 3.5 Z" fill="none" stroke={INK} strokeWidth="4.8" strokeLinejoin="round" />
    </svg>
  );
}

// A still eye for pictures (covers, the Theme Builder preview): the same
// layers and ink ring, the pupil set off center by `look` (-1 to 1).
export function StillEye({ look = [0.4, 0.3], className = '' }: { look?: [number, number]; className?: string }) {
  return (
    <span className={`relative inline-block aspect-square pointer-events-none ${className}`} aria-hidden="true">
      <img src={PART('white')} alt="" className="absolute inset-0 w-full h-full" />
      <img src={PART('pupil')} alt="" className="absolute inset-0 w-full h-full" style={{ transform: `translate(${look[0] * 15}%, ${look[1] * 15}%)` }} />
      <img src={PART('shine')} alt="" className="absolute inset-0 w-full h-full" />
      <EyeRing />
    </span>
  );
}
