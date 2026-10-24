import type { GameManifest } from '../types';

// Kept apart from the game so the game list loads without loading every game.
export const spaceBowlingManifest: GameManifest = {
  id: 'space-bowling',
  name: 'Space Bowling',
  description: 'Answer right to roll a planet down the lane and knock over ten alien pins.',
  modes: ['share', 'solo'],
  questionKinds: ['mc'],
  themePieces: [
    { id: 'background', label: 'Background', width: 1000, height: 1300, hint: 'The sky behind the lane' },
    { id: 'lane', label: 'Lane', width: 800, height: 1000, hint: 'The color of the lane', color: '#314677' },
    { id: 'ball', label: 'Ball', width: 128, height: 128, hint: 'The planet you roll', color: '#ed9d75' },
    { id: 'pin', label: 'Pin', width: 64, height: 128, hint: 'The color of the pins', color: '#fbfcf8' },
    { id: 'cover', label: 'Cover', width: 600, height: 600, hint: 'The picture on the game card' },
  ],
  rounds: { label: 'Frames', min: 1, max: 10, default: 3 },
  hasCpu: true,
  borrowedFrom: 'Dashboard src/games/spaceBowling/logic.ts (Space Bowling), rebuilt flat',
};
