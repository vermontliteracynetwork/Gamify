import type { GameManifest } from '../types';

// Kept apart from the game so the game list loads without loading every game.
export const bowlingManifest: GameManifest = {
  id: 'bowling',
  name: 'Bowling',
  description: 'Answer right to roll the ball down the lane and knock over the pins.',
  modes: ['share', 'solo'],
  questionKinds: ['mc'],
  themePieces: [
    { id: 'background', label: 'Background', width: 1000, height: 1300, hint: 'The sky behind the lane' },
    { id: 'lane', label: 'Lane', width: 800, height: 1000, hint: 'The color of the lane', color: '#314677' },
    { id: 'ball', label: 'Ball', width: 128, height: 128, hint: 'The ball you roll', color: '#ed9d75' },
    { id: 'pin', label: 'Pin', width: 64, height: 128, hint: 'One pin (a picture, or just its color)', color: '#fbfcf8' },
    ...Array.from({ length: 10 }, (_, i) => ({ id: `team-${i + 1}`, label: `Team ${i + 1} icon`, width: 256, height: 256, hint: `The round badge for team ${i + 1}` })),
    { id: 'cover', label: 'Cover', width: 600, height: 600, hint: 'The picture on the game card' },
  ],
  rounds: { label: 'Frames', min: 1, max: 10, default: 3 },
  items: {
    label: 'Power-ups', hint: 'Sometimes a right answer brings one. Give each one art and a power.', max: 6, width: 256, height: 256,
    abilities: [
      { id: 'double', label: 'Doubles the next roll', hint: 'The pins knocked down count twice' },
      { id: 'bonus', label: 'Bonus points', hint: 'Points right away', amount: { label: 'Points', min: 1, max: 30, step: 1, default: 5 } },
      { id: 'magnet', label: 'One more pin', hint: 'The next roll knocks down one extra pin' },
    ],
    classic: [
      { id: 'classic-golden-pin', name: 'Golden Pin', ability: 'double', motion: 'sparkle', often: 1, art: 'golden-pin' },
      { id: 'classic-prize-bag', name: 'Prize Bag', ability: 'bonus', amount: 5, motion: 'bob', often: 2, art: 'prize-bag' },
      { id: 'classic-pin-magnet', name: 'Pin Magnet', ability: 'magnet', motion: 'wiggle', often: 1, art: 'magnet' },
    ],
  },
  hasCpu: true,
  borrowedFrom: 'Dashboard src/games/spaceBowling/logic.ts (Bowling), rebuilt flat',
};
