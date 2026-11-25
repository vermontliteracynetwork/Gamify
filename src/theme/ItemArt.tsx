import { motion } from 'motion/react';
import type { ThemeItem } from './types';
import { ClassicItemSvg } from './classicItems';
import { CrayonPowerUp, type PowerId } from '../brand/CrayonKit';

// Classic power-ups wear the one crayon kit (Classic Art Director, 2026-11-25:
// the old black-line art and the 3D webp pictures were off the Classic style).
// A theme's own picture still wins; only Classic items (id classic-*) map.
const KIT: Record<string, PowerId> = {
  'Double Roll': 'double-dice', '2x': 'double-points', 'Double Star': 'double-points', Tornado: 'tornado', Wheel: 'spin-wheel',
  Potion: 'potion', Shield: 'shield', 'Prize Bag': 'treasure-chest', 'Treasure Chest': 'treasure-chest', 'Pocket Watch': 'extra-time', Fireball: 'lightning', Lightning: 'lightning', 'Lightning Ball': 'lightning',
  'Pin Magnet': 'magnet', 'Jackpot Magnet': 'magnet', 'Bumper Rails': 'shield', 'Golden Pin': 'double-points', 'Golden Ball': 'double-points',
  'Pin Twister': 'tornado', 'Mystery Box': 'mystery-box', 'Mystery Bottle': 'mystery-box', 'Bubble Bundle': 'one-more', 'Double Drop': 'double-points',
  'Extra Plate': 'one-more', 'Tip Jar': 'treasure-chest', 'Watering Can': 'one-more', 'Rain Cloud': 'freeze', 'Golden Hook': 'double-points',
  'Super Shooter': 'lightning', 'Bouncy Ball': 'one-more', 'Message in a Bottle': 'mystery-box',
};
export const kitFor = (item: ThemeItem): PowerId | undefined => (item.id.startsWith('classic-') ? KIT[item.name] : undefined);

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
      {kitFor(item) && !item.image?.startsWith('data:')
        ? <CrayonPowerUp id={kitFor(item)!} size={size} />
        : item.image
        ? <img src={item.image} alt="" className="w-full h-full object-contain" />
        : item.art ? <ClassicItemSvg art={item.art} size={size} />
        : <span className="w-full h-full rounded-full border-bold border-border flex items-center justify-center font-display" style={{ background: item.color ?? '#fdfd94', fontSize: size * 0.4 }}>{item.name.slice(0, 1).toUpperCase()}</span>}
    </motion.span>
  );
}
