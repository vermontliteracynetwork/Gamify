import type { GameManifest } from '../types';

// Kept apart from the game so the game list loads without loading every game.
export const bowlingManifest: GameManifest = {
  id: 'bowling',
  name: 'Bowling',
  description: 'Answer right to roll the ball down the lane and knock over the pins.',
  modes: ['share', 'versus', 'solo'],
  questionKinds: ['mc'],
  themePieces: [
    { id: 'background', label: 'Background', width: 1000, height: 1300, hint: 'The alley wall behind the lane' },
    { id: 'lane', label: 'Lane', width: 800, height: 1000, hint: 'The color of the lane', color: '#e2b07a' },
    { id: 'ball', label: 'Ball', width: 128, height: 128, hint: 'The ball you roll (Classic: a ball in each player\'s own color)' },
    { id: 'pin', label: 'Pin', width: 64, height: 128, hint: 'One pin (a picture, or just its color)', color: '#fbfcf8' },
    ...Array.from({ length: 10 }, (_, i) => ({ id: `team-${i + 1}`, label: `Team ${i + 1} icon`, width: 256, height: 256, hint: `The round badge for team ${i + 1}` })),
    { id: 'cover', label: 'Cover', width: 600, height: 600, hint: 'The picture on the game card' },
  ],
  rounds: { label: 'Frames', min: 1, max: 10, default: 3 },
  items: {
    label: 'Power-ups', hint: 'Sometimes a right answer brings one. Give each one art and a power.', max: 6, width: 256, height: 256,
    // Classic roles (teacher, 2026-10-31): held for the player's next turn,
    // shown under the scores, gone after that turn. Themes can redraw them.
    abilities: [
      { id: 'double', label: '2x points', hint: 'Earn double points' },
      { id: 'magnet', label: 'Pin magnet', hint: 'One more pin falls on your next roll' },
      { id: 'bumpers', label: 'Bumper rails', hint: 'Your next roll goes right down the middle' },
      { id: 'mega', label: 'Mega ball', hint: 'Your next roll knocks down every pin' },
      { id: 'mystery', label: 'Mystery points', hint: 'Surprise points from 1 to 10' },
      { id: 'swipe', label: 'Sneaky swipe', hint: 'Take points from the leader', amount: { label: 'Points', min: 1, max: 30, step: 1, default: 5 } },
      { id: 'bonus', label: 'Bonus points', hint: 'Points right away', amount: { label: 'Points', min: 1, max: 30, step: 1, default: 5 } },
    ],
    classic: [
      { id: 'classic-golden-pin', name: 'Golden Pin', ability: 'double', motion: 'sparkle', often: 2, art: 'golden-pin' },
      { id: 'classic-pin-magnet', name: 'Pin Magnet', ability: 'magnet', motion: 'wiggle', often: 2, image: '/classic/powerups/magnet.webp' },
      { id: 'classic-bumper-rails', name: 'Bumper Rails', ability: 'bumpers', motion: 'bob', often: 2, image: '/classic/powerups/shield.webp' },
      { id: 'classic-fireball', name: 'Fireball', ability: 'mega', motion: 'sparkle', often: 1, image: '/classic/powerups/fireball.webp' },
      { id: 'classic-mystery-box', name: 'Mystery Box', ability: 'mystery', motion: 'bob', often: 2, image: '/classic/powerups/mystery.webp' },
      { id: 'classic-sneaky-swipe', name: 'Sneaky Swipe', ability: 'swipe', amount: 5, motion: 'wiggle', often: 1, image: '/classic/powerups/lightning.webp' },
    ],
  },
  hasCpu: true,
  borrowedFrom: 'Dashboard src/games/spaceBowling/logic.ts (Bowling), rebuilt flat',
};
