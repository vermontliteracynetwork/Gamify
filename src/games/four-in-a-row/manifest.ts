import type { GameManifest } from '../types';

// Kept apart from the game so the game list loads without loading every game.
export const fourInARowManifest: GameManifest = {
  id: 'four-in-a-row',
  name: 'Four in a Row',
  description: 'Answer right, then drop your piece. Get four in a row!',
  modes: ['versus'],
  questionKinds: ['mc'],
  themePieces: [
    { id: 'background', label: 'Background', width: 1600, height: 1200, hint: 'Behind the board' },
    { id: 'board', label: 'Board', width: 1000, height: 860, hint: 'The frame with holes', color: '#4f8fe0' },
    { id: 'piece-1', label: 'Player 1 piece', width: 128, height: 128, hint: 'The first player\'s round piece' },
    { id: 'piece-2', label: 'Player 2 piece', width: 128, height: 128, hint: 'The second player\'s round piece' },
    ...Array.from({ length: 10 }, (_, i) => ({ id: `team-${i + 1}`, label: `Team ${i + 1} icon`, width: 256, height: 256, hint: `The round badge for team ${i + 1}` })),
    { id: 'cover', label: 'Cover', width: 600, height: 600, hint: 'The picture on the game card' },
  ],
  // Power-ups (Golden Rule pass, 2026-10-31): a right answer may bring one;
  // it waits for the player's next turn under the scores.
  // No power-ups in this game (teacher, 2026-11-20).
  hasCpu: true,
};
