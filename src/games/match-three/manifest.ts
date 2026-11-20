import { playerIconPieces } from '../playerIcons';
import type { GameManifest } from '../types';

// Kept apart from the game so the game list loads without loading every game.
export const matchThreeManifest: GameManifest = {
  id: 'match-three',
  name: 'Match Three',
  description: 'Swap pieces to make rows of 3. Answer questions to keep playing.',
  modes: ['solo'],
  questionKinds: ['mc'],
  themePieces: [
    { id: 'background', label: 'Background', width: 1600, height: 1200, hint: 'Behind the board' },
    ...[0, 1, 2, 3, 4, 5].map((i) => ({ id: `tile-${i}`, label: `Piece ${i + 1}`, width: 128, height: 128, hint: 'One of the six pieces you match', color: ['#f2c27b', '#f6a5c0', '#9fd8f0', '#f7b267', '#fbe38a', '#c9a27e'][i] })),
    { id: 'board', label: 'Board', width: 900, height: 900, hint: 'The board the pieces sit on', color: '#ffffff' },
    // Pieces a combo makes (teacher, 2026-11-18: like a wrapped candy), each
    // its own design: a row of 4 makes a line piece, an L or T a bomb, a row
    // of 5 a rainbow.
    { id: 'special-row', label: 'Sideways line piece', width: 128, height: 128, hint: 'Made by 4 in a row. When matched it clears its whole row.' },
    { id: 'special-col', label: 'Up and down line piece', width: 128, height: 128, hint: 'Made by 4 in a column. When matched it clears its whole column.' },
    { id: 'special-burst', label: 'Bomb piece', width: 128, height: 128, hint: 'Made by an L or T shape. When matched it pops everything around it.' },
    { id: 'special-rainbow', label: 'Rainbow piece', width: 128, height: 128, hint: 'Made by 5 in a row. Swap it with any piece to pop all of that kind.' },
    ...playerIconPieces('Player'),
    { id: 'cover', label: 'Cover', width: 600, height: 600, hint: 'The picture on the game card' },
    { id: 'title', label: 'Title', width: 1200, height: 360, hint: 'The theme name in your own lettering (shown on the theme card)' },
  ],
  rounds: { label: 'Rounds', min: 1, max: 10, default: 3 },
  questionsPerBreak: { label: 'Questions each time', min: 1, max: 10, default: 2 },
  // No power-ups in this game (teacher, 2026-11-20).
  hasCpu: false,
  borrowedFrom: 'Dashboard src/routes/student/MatchThree3.tsx and src/lib/matchThree.ts',
};
