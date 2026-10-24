import type { GameManifest } from '../types';

// Kept apart from the game so the game list loads without loading every game.
export const bakeryMatchManifest: GameManifest = {
  id: 'bakery-match',
  name: 'Bakery Match',
  description: 'Swap treats to make rows of 3. Answer questions to keep baking.',
  modes: ['solo'],
  questionKinds: ['mc'],
  themePieces: [
    { id: 'background', label: 'Background', width: 1600, height: 1200, hint: 'Behind the board' },
    ...[0, 1, 2, 3, 4, 5].map((i) => ({ id: `tile-${i}`, label: `Treat ${i + 1}`, width: 128, height: 128, hint: 'One of the six treats you match', color: ['#f2c27b', '#f6a5c0', '#9fd8f0', '#f7b267', '#fbe38a', '#c9a27e'][i] })),
    { id: 'board', label: 'Board', width: 900, height: 900, hint: 'The tray the treats sit on', color: '#ffffff' },
    { id: 'cover', label: 'Cover', width: 600, height: 600, hint: 'The picture on the game card' },
  ],
  rounds: { label: 'Rounds', min: 1, max: 10, default: 3 },
  questionsPerBreak: { label: 'Questions each time', min: 1, max: 10, default: 2 },
  hasCpu: false,
  borrowedFrom: 'Dashboard src/routes/student/BakeryMatch3.tsx and src/lib/matchThree.ts',
};
