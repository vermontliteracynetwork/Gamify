import type { GameManifest } from '../types';

// Kept apart from the game so the game list loads without loading every game.
export const flashcardsManifest: GameManifest = {
  id: 'flashcards',
  name: 'Flashcards',
  description: 'Study at your own pace: flip a card, then say if you knew it. Cards you miss come back.',
  modes: ['solo'],
  questionKinds: ['mc'],
  themePieces: [
    { id: 'background', label: 'Background', width: 1600, height: 1200, hint: 'Behind the cards' },
    { id: 'card-front', label: 'Card front', width: 800, height: 500, hint: 'The question side of each card', color: '#fbfcf8' },
    { id: 'card-back', label: 'Card back', width: 800, height: 500, hint: 'The answer side of each card', color: '#fdfd94' },
    { id: 'cover', label: 'Cover', width: 600, height: 600, hint: 'The picture on the game card' },
  ],
  rounds: { label: 'Cards', min: 5, max: 30, default: 10 },
  hasCpu: false,
};
