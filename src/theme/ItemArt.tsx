import { motion } from 'motion/react';
import type { ThemeItem } from './types';

// A theme's power-up item: its picture (or a colored circle with its first
// letter), moving the way the theme chose. Still when motion is off.
const MOVES = {
  wiggle: { animate: { rotate: [-8, 8, -8] }, transition: { duration: 0.6, repeat: Infinity } },
  bob: { animate: { y: [0, -8, 0] }, transition: { duration: 1.4, repeat: Infinity } },
  sparkle: { animate: { scale: [1, 1.12, 1], filter: ['brightness(1)', 'brightness(1.35)', 'brightness(1)'] }, transition: { duration: 0.9, repeat: Infinity } },
  spin: { animate: { rotate: [0, 360] }, transition: { duration: 2.4, repeat: Infinity, ease: 'linear' } },
  none: { animate: {}, transition: {} },
} as const;

export default function ItemArt({ item, size, still = false }: { item: ThemeItem; size: number; still?: boolean }) {
  const move = still ? MOVES.none : MOVES[item.motion] ?? MOVES.none;
  return (
    <motion.span className="inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }} animate={move.animate} transition={move.transition} aria-hidden="true">
      {item.image
        ? <img src={item.image} alt="" className="w-full h-full object-contain" />
        : <span className="w-full h-full rounded-full border-[2.5px] border-border flex items-center justify-center font-display" style={{ background: item.color ?? '#fdfd94', fontSize: size * 0.4 }}>{item.name.slice(0, 1).toUpperCase()}</span>}
    </motion.span>
  );
}
