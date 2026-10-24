import type { GameManifest } from '../types';

// Kept apart from the game so the game list loads without loading every game.
export const starQuizManifest: GameManifest = {
  id: 'star-quiz',
  name: 'Question Tracker',
  description: 'Every right answer adds a star until the whole sky is full.',
  modes: ['solo'],
  questionKinds: ['mc'],
  themePieces: [
    { id: 'background', label: 'Background', width: 1600, height: 1000, hint: 'The scene that fills up (a night sky, the ocean, the savanna)' },
    ...[1, 2, 3, 4, 5, 6].map((n) => ({ id: `item-${n}`, label: `Item ${n}`, width: 256, height: 256, hint: 'Something that appears for each right answer (a star, a fish, a giraffe)', ...(n === 1 ? { color: '#ffd166' } : {}) })),
  ],
  rounds: { label: 'Questions', min: 5, max: 30, default: 10 },
  hasCpu: false,
};
