import type { GameManifest } from '../types';
import { SHAPES } from './googler';

// Kept apart from the game so the game list loads without loading every game.
// Googler (teacher, 2026-11-26): a falling-block puzzle where full rows with a
// googly eye send the eye to a counter. Solo, or Live: Cooperative adds every
// student's eyes up, Competitive ranks the class by eyes collected.
export const googlerManifest: GameManifest = {
  id: 'googler',
  name: 'Googler',
  description: 'Drop blocks on one of three spots, clear rows and collect the googly eyes. Answer questions for power-ups.',
  tagline: 'Drop blocks, clear rows, collect googly eyes.',
  modes: ['solo', 'live'],
  questionKinds: ['mc'],
  themePieces: [
    { id: 'background', label: 'Background', width: 1600, height: 1200, hint: 'Behind the game board' },
    { id: 'board', label: 'Game board space', width: 800, height: 1200, hint: 'The space the blocks fall into', color: '#fffaf0' },
    // Every shape designed on its own (teacher: "users can design the blocks
    // (all shapes individually)"): one square unit, used for every unit of that shape.
    ...SHAPES.map((s) => ({ id: `block-${s.id}`, label: `${s.name} block`, width: 128, height: 128, hint: `One square of the ${s.name.toLowerCase()} shape`, color: s.color })),
    { id: 'cover', label: 'Cover', width: 600, height: 600, hint: 'The picture on the game card' },
  ],
  rounds: { label: 'Drops before questions', min: 2, max: 10, default: 4 },
  questionsPerBreak: { label: 'Questions each time', min: 1, max: 5, default: 1 },
  items: {
    label: 'Power-ups', hint: 'Sometimes a right answer brings one. Give each one art and a power.', max: 6, width: 256, height: 256,
    // Classic uses the default Classic power-up art (teacher, 2026-11-26).
    abilities: [
      { id: 'choices', label: 'More choices', hint: 'Five spots to pick from instead of three.', amount: { label: 'Drops', min: 1, max: 5, step: 1, default: 3 } },
      { id: 'blast', label: 'Row zapper', hint: 'Clears the bottom row and catches its googly eyes.' },
      { id: 'magnet', label: 'Eye magnet', hint: 'Pulls googly eyes out of the blocks into your counter.', amount: { label: 'Eyes', min: 1, max: 3, step: 1, default: 2 } },
      { id: 'freeze', label: 'Freeze', hint: 'No new rows push up for a few drops.', amount: { label: 'Drops', min: 1, max: 5, step: 1, default: 3 } },
      { id: 'double', label: 'Double XP', hint: 'Your next rows cleared earn twice the XP.' },
      { id: 'shuffle', label: 'Swap block', hint: 'Trades your block for a brand new one.' },
    ],
    classic: [
      { id: 'classic-lucky-key', name: 'Lucky Key', ability: 'choices', amount: 3, motion: 'wiggle', often: 2, image: '/classic/powerups/key.webp' },
      { id: 'classic-lightning', name: 'Lightning', ability: 'blast', motion: 'sparkle', often: 2, image: '/classic/powerups/lightning.webp' },
      { id: 'classic-magnet', name: 'Magnet', ability: 'magnet', amount: 2, motion: 'wiggle', often: 2, image: '/classic/powerups/magnet.webp' },
      { id: 'classic-ice', name: 'Freeze', ability: 'freeze', amount: 3, motion: 'bob', often: 1, image: '/classic/powerups/ice.webp' },
      { id: 'classic-double-star', name: 'Double Star', ability: 'double', motion: 'sparkle', often: 1, art: 'double-star' },
      { id: 'classic-tornado', name: 'Tornado', ability: 'shuffle', motion: 'spin', often: 1, image: '/classic/powerups/tornado.webp' },
    ],
  },
  hasCpu: false,
};
