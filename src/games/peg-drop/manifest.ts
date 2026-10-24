import type { GameManifest } from '../types';

// Kept apart from the game so the game list loads without loading every game.
export const pegDropManifest: GameManifest = {
  id: 'peg-drop',
  name: 'Peg Drop',
  description: 'Answer right, pick a spot, and drop the ball through the pegs into a bucket of points.',
  modes: ['share', 'solo'],
  questionKinds: ['mc'],
  themePieces: [
    { id: 'background', label: 'Background', width: 1600, height: 1200, hint: 'Behind the board' },
    { id: 'board', label: 'Board', width: 1000, height: 1200, hint: 'The board the pegs sit on', color: '#314677' },
    { id: 'ball', label: 'Ball', width: 128, height: 128, hint: 'The ball that drops', color: '#fdfd94' },
    { id: 'peg', label: 'Peg', width: 64, height: 64, hint: 'One peg', color: '#fbfcf8' },
    { id: 'cover', label: 'Cover', width: 600, height: 600, hint: 'The picture on the game card' },
  ],
  rounds: { label: 'Rounds', min: 1, max: 10, default: 3 },
  hasCpu: true,
  borrowedFrom: 'Dashboard src/routes/student/PlinkoDrop.tsx (Plinko), rebuilt',
};
