import type { Transition, Variants } from 'motion/react';
import { POP_IN } from '../../engine/pace';

// Gamify's shared motion vocabulary (docs/ui-libraries.md). Use these before
// writing a one-off spring or duration so every screen moves the same way.
// Times are the Normal game speed; multiply by pace() for game stages.

export const SPRING = {
  /** Menus, pop-ups, cards arriving: unhurried and easy to follow. */
  pop: POP_IN,
  /** Buttons, toggles, chips: quick and firm under a finger or mouse. */
  snappy: { type: 'spring', stiffness: 420, damping: 28 },
  /** Game pieces landing, rewards: a visible bounce with weight. */
  bouncy: { type: 'spring', stiffness: 260, damping: 12, mass: 1.2 },
  /** Big panels and page sections: soft, no overshoot. */
  soft: { type: 'spring', stiffness: 120, damping: 24 },
} as const satisfies Record<string, Transition>;

export const EASE = {
  out: [0.22, 1, 0.36, 1],
  inOut: [0.65, 0, 0.35, 1],
} as const;

export const DURATION = { fast: 0.18, base: 0.32, slow: 0.6 } as const;

/** Sticker buttons: lift on hover, squash on press (laptops and iPads). */
export const PRESS = {
  whileHover: { y: -2 },
  whileTap: { scale: 0.95, y: 1 },
  transition: SPRING.snappy,
} as const;

/** One item arriving: fade and rise. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: SPRING.soft },
};

/** One item popping in: pop from small, with a little overshoot. */
export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  show: { opacity: 1, scale: 1, transition: SPRING.pop },
};

/** A list or grid whose children use fadeUp or popIn. */
export function staggerList(gap = 0.06, delay = 0): Variants {
  return { hidden: {}, show: { transition: { staggerChildren: gap, delayChildren: delay } } };
}
