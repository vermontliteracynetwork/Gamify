import type { GameManifest } from '../types';

// Kept apart from the game so the game list loads without loading every game.
export const memoryMatchManifest: GameManifest = {
  id: 'memory-match',
  name: 'Memory Match',
  description: 'Flip two cards to find each question and its answer. Remember where they hide!',
  modes: ['solo', 'versus'],
  questionKinds: ['mc'],
  themePieces: [
    { id: 'background', label: 'Background', width: 1600, height: 1200, hint: 'Behind the cards' },
    { id: 'card-back', label: 'Card back', width: 300, height: 225, hint: 'What every card looks like face down', color: '#b4c4fb' },
    ...Array.from({ length: 10 }, (_, i) => ({ id: `team-${i + 1}`, label: `Team ${i + 1} icon`, width: 256, height: 256, hint: `The round badge for team ${i + 1}` })),
    { id: 'cover', label: 'Cover', width: 600, height: 600, hint: 'The picture on the game card' },
  ],
  hasCpu: true,
};
