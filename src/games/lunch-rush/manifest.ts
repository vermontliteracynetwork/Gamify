import type { GameManifest } from '../types';

// Kept apart from the game so the game list loads without loading every game.
export const lunchRushManifest: GameManifest = {
  id: 'lunch-rush',
  name: 'Lunch Rush',
  description: 'Answer right to earn serves, then bring each hungry guest the food they want.',
  modes: ['share', 'solo'],
  questionKinds: ['mc'],
  themePieces: [
    { id: 'background', label: 'Wall', width: 1500, height: 1000, hint: 'The wall behind the counter', color: '#fde2c4' },
    { id: 'counter', label: 'Counter', width: 1500, height: 300, hint: 'The color of the counter', color: '#ed9d75' },
    { id: 'cover', label: 'Cover', width: 600, height: 600, hint: 'The picture on the game card' },
  ],
  rounds: { label: 'Questions', min: 2, max: 15, default: 6 },
  hasCpu: true,
};
