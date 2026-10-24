import type { GameManifest } from '../types';

export const BUBBLE_COLORS = ['#fdfd94', '#e5635f', '#8fe3a0', '#8ec5ff', '#f6a5c0', '#f7b267'];

// Kept apart from the game so the game list loads without loading every game.
export const bubblePopManifest: GameManifest = {
  id: 'bubble-pop',
  name: 'Bubble Pop',
  description: 'Answer questions to load bubbles, then aim and match 3 to pop them.',
  modes: ['solo'],
  questionKinds: ['mc'],
  themePieces: [
    { id: 'background', label: 'Background', width: 1600, height: 1200, hint: 'Behind the board' },
    { id: 'board', label: 'Board', width: 1000, height: 1300, hint: 'Behind the bubbles', color: '#314677' },
    ...BUBBLE_COLORS.map((color, i) => ({ id: `bubble-${i}`, label: `Bubble ${i + 1}`, width: 128, height: 128, hint: 'One of the six bubbles you match', color })),
    { id: 'cover', label: 'Cover', width: 600, height: 600, hint: 'The picture on the game card' },
  ],
  rounds: { label: 'Question breaks', min: 1, max: 10, default: 4 },
  questionsPerBreak: { label: 'Questions each time', min: 1, max: 5, default: 1 },
  hasCpu: false,
  borrowedFrom: 'Dashboard src/games/bubbleShooter/engine.ts (Bubble Shooter), trimmed and rebuilt',
};
