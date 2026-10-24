import type { GameManifest } from '../types';

// Kept apart from the game so the game list loads without loading every game.
export const gameShowManifest: GameManifest = {
  id: 'game-show',
  name: 'Game Show',
  description: 'Teams take turns on the big screen. Answer right to pick a surprise card or a square.',
  modes: ['share'],
  questionKinds: ['mc'],
  themePieces: [
    { id: 'background', label: 'Background', width: 1920, height: 1080, hint: 'Behind the whole board' },
    { id: 'card-back', label: 'Card back', width: 300, height: 220, hint: 'The front of each surprise card before it flips', color: '#fdfd94' },
    { id: 'square', label: 'Grid square', width: 300, height: 180, hint: 'One square of the category grid', color: '#fdfd94' },
    ...Array.from({ length: 10 }, (_, i) => ({ id: `team-${i + 1}`, label: `Team ${i + 1} icon`, width: 256, height: 256, hint: `The round badge for team ${i + 1}` })),
    { id: 'trophy', label: 'Winner trophy', width: 400, height: 400, hint: 'Shown on the winner screen' },
    { id: 'cover', label: 'Cover', width: 600, height: 600, hint: 'The picture on the game card' },
  ],
  hasCpu: true,
  borrowedFrom: 'Dashboard team games (Plinko turns) and Baamboozle-style rules, rebuilt',
};
