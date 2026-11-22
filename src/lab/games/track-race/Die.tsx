import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import type { Sfx } from '../../sfx';

// The big die (her dice model, rendered frames): it tumbles until it is
// tapped, lands on a face with a bounce and waits for another tap so the
// class can count the pips (teacher, 2026-11-13). The computer's die stops
// and goes on by itself.
export default function Die({ base, count = 1, cpu, still, sfx, size, onDone }: {
  base: string; count?: number; cpu: boolean; still: boolean; sfx: Sfx; size: number; onDone: (values: number[]) => void;
}) {
  const [frame, setFrame] = useState(0);
  const [values, setValues] = useState<number[] | null>(null);
  const [ready, setReady] = useState(false);
  const done = useRef(false);

  useEffect(() => {
    if (values) return;
    sfx.dice();
    const id = window.setInterval(() => setFrame((f) => (f + 1) % 8), still ? 220 : 70);
    return () => window.clearInterval(id);
  }, [values]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!values) return;
    const id = window.setTimeout(() => setReady(true), 650);
    return () => window.clearTimeout(id);
  }, [values]);

  const tapRef = useRef<() => void>(() => {});
  tapRef.current = tap;
  function tap() {
    if (!values) { sfx.thud(); setValues(Array.from({ length: count }, () => 1 + Math.floor(Math.random() * 6))); return; }
    if (!ready || done.current) return;
    done.current = true; sfx.tap(); onDone(values);
  }

  // The computer stops and goes on its own, slowly enough to follow.
  // (Keyed on the die's stage only, so the tumble's re-renders never reset it.)
  const stage = !values ? 0 : ready ? 2 : 1;
  useEffect(() => {
    if (!cpu || stage === 1) return;
    const id = window.setTimeout(() => tapRef.current(), stage === 2 ? 1300 : 1400 + Math.random() * 500);
    return () => window.clearTimeout(id);
  }, [cpu, stage]);

  const total = values ? values.reduce((a, b) => a + b, 0) : 0;
  const label = !values ? 'Tap to stop the die' : ready ? `Rolled ${total}. Tap to move` : `Rolled ${total}`;
  return (
    <div className="absolute inset-0 z-30 grid place-items-center pointer-events-none">
      <motion.button type="button" onClick={tap} disabled={cpu || (!!values && !ready)} aria-label={label} title={label}
        className="pointer-events-auto relative flex gap-[6%] items-center justify-center rounded-full disabled:cursor-default focus-visible:outline-4"
        style={{ width: size * count * 1.05, height: size * 1.05 }}
        initial={still ? false : { scale: 0.2, y: -size, rotate: -90 }} animate={{ scale: 1, y: 0, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 14 }}
        whileHover={still || cpu ? undefined : { scale: 1.05 }}>
        {ready && !cpu && !still && (
          <motion.span aria-hidden="true" className="absolute inset-[-12%] rounded-full" style={{ background: 'radial-gradient(circle, rgba(253,253,148,0.85) 0%, rgba(253,253,148,0) 68%)' }}
            animate={{ scale: [0.9, 1.08, 0.9], opacity: [0.7, 1, 0.7] }} transition={{ duration: 1.2, repeat: Infinity }} />
        )}
        {Array.from({ length: count }, (_, i) => (
          <motion.span key={i} className="relative block" style={{ width: size, height: size }}
            animate={values ? { rotate: [i ? 12 : -14, 0], y: [0, -size * 0.18, 0], scale: [1.18, 0.9, 1] } : still ? undefined : { rotate: [-12, 14, -8, 10], x: [-4, 5, -3, 4], y: [0, -10, 2, -6] }}
            transition={values ? { duration: 0.55, ease: 'easeOut' } : { duration: 0.35, repeat: Infinity, delay: i * 0.08 }}>
            <img src={values ? `${base}/face-${values[i]}.webp` : `${base}/roll-${(frame + i * 3) % 8}.webp`} alt="" draggable={false}
              className="w-full h-full object-contain select-none" style={{ filter: 'drop-shadow(0 6px 0 rgba(0,0,0,0.55)) drop-shadow(0 18px 24px rgba(36,28,61,0.45))' }} />
          </motion.span>
        ))}
      </motion.button>
    </div>
  );
}
