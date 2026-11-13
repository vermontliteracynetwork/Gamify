import type { GameManifest } from '../types';

// Kept apart from the game so the game list loads without loading every game.
export const starQuizManifest: GameManifest = {
  id: 'star-quiz',
  name: 'Question Tracker',
  description: 'Every right answer adds a star until the whole sky is full. With the class: fill one sky together, or race to get the most stars in your color.',
  modes: ['live', 'solo'],
  questionKinds: ['mc'],
  themePieces: [
    { id: 'background', label: 'Background', width: 1600, height: 1000, hint: 'The scene that fills up (a night sky, the ocean, the savanna)' },
    ...[1, 2, 3, 4, 5, 6].map((n) => ({ id: `item-${n}`, label: `Item ${n}`, width: 256, height: 256, hint: 'Something that appears for each right answer (a star, a fish, a giraffe)', ...(n === 1 ? { color: '#ffd166' } : {}) })),
    { id: 'cover', label: 'Cover', width: 600, height: 600, hint: 'The picture on the game card' },
    { id: 'title', label: 'Title', width: 1200, height: 360, hint: 'The theme name in your own lettering (shown on the theme card)' },
  ],
  rounds: { label: 'Questions', min: 5, max: 30, default: 10 },
  hasCpu: false,
};
