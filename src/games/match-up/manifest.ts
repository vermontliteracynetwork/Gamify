import type { GameManifest } from '../types';

// Kept apart from the game so the game list loads without loading every game.
export const matchUpManifest: GameManifest = {
  id: 'match-up',
  name: 'Match Up',
  description: 'Tap a question, then tap its answer. Match them all as fast as you can!',
  modes: ['solo'],
  questionKinds: ['mc'],
  themePieces: [
    { id: 'background', label: 'Background', width: 1600, height: 1200, hint: 'Behind the tiles' },
    { id: 'question-tile', label: 'Question tile', width: 400, height: 160, hint: 'The tiles on the left', color: '#fbfcf8' },
    { id: 'answer-tile', label: 'Answer tile', width: 400, height: 160, hint: 'The tiles on the right', color: '#fdfd94' },
    { id: 'cover', label: 'Cover', width: 600, height: 600, hint: 'The picture on the game card' },
  ],
  hasCpu: false,
};
