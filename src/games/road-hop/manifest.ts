import type { GameManifest } from '../types';

// Kept apart from the game so the game list loads without loading every game.
export const roadHopManifest: GameManifest = {
  id: 'road-hop',
  name: 'Road Hop',
  description: 'Answer right to earn hops, then hop the hopper across busy roads.',
  modes: ['share', 'solo'],
  questionKinds: ['mc'],
  themePieces: [
    { id: 'background', label: 'Grass', width: 1000, height: 1300, hint: 'The grass strips', color: '#8fe3a0' },
    { id: 'road', label: 'Road', width: 1000, height: 200, hint: 'The color of the road', color: '#4a4f6a' },
    { id: 'hopper', label: 'Hopper', width: 128, height: 128, hint: 'The one who hops', color: '#9bd35a' },
    { id: 'car', label: 'Car', width: 256, height: 128, hint: 'The color of the first car', color: '#e5635f' },
    { id: 'cover', label: 'Cover', width: 600, height: 600, hint: 'The picture on the game card' },
  ],
  rounds: { label: 'Questions', min: 2, max: 15, default: 6 },
  hasCpu: true,
};
