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
    { id: 'pin', label: 'Pin', width: 64, height: 128, hint: 'The color of the pins', color: '#fbfcf8' },
    ...Array.from({ length: 10 }, (_, i) => ({ id: `team-${i + 1}`, label: `Team ${i + 1} icon`, width: 256, height: 256, hint: `The round badge for team ${i + 1}` })),
    { id: 'cover', label: 'Cover', width: 600, height: 600, hint: 'The picture on the game card' },
  ],
  rounds: { label: 'Frames', min: 1, max: 10, default: 3 },
  hasCpu: true,
  borrowedFrom: 'Dashboard src/games/spaceBowling/logic.ts (Bowling), rebuilt flat',
};
