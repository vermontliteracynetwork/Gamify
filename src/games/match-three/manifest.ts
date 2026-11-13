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
    { id: 'cover', label: 'Cover', width: 600, height: 600, hint: 'The picture on the game card' },
    { id: 'title', label: 'Title', width: 1200, height: 360, hint: 'The theme name in your own lettering (shown on the theme card)' },
  ],
  rounds: { label: 'Rounds', min: 1, max: 10, default: 3 },
  questionsPerBreak: { label: 'Questions each time', min: 1, max: 10, default: 2 },
  items: {
    label: 'Power-ups', hint: 'Sometimes a right answer brings one. Give each one art and a power.', max: 6, width: 256, height: 256,
    // Classic roles (teacher, 2026-10-31): held for the next round, listed
    // under the score, gone after it. Themes can redraw and rename them.
    abilities: [
      { id: 'moves', label: 'More moves', hint: 'Gives you extra moves this round.', amount: { label: 'Moves', min: 1, max: 5, step: 1, default: 2 } },
      { id: 'double', label: 'Double points', hint: 'Your next match scores twice the points.' },
      { id: 'blast', label: 'Color blast', hint: 'Pops every piece of one kind on the board at once.' },
      { id: 'shuffle', label: 'Shake up', hint: 'Mixes the board into a brand new one when you are stuck.' },
      { id: 'bonus', label: 'Bonus points', hint: 'Adds points to your score right away.', amount: { label: 'Points', min: 10, max: 300, step: 10, default: 100 } },
    ],
    classic: [
      { id: 'classic-pocket-watch', name: 'Pocket Watch', ability: 'moves', amount: 2, motion: 'wiggle', often: 2, image: '/classic/powerups/time.webp' },
      { id: 'classic-double-star', name: 'Double Star', ability: 'double', motion: 'sparkle', often: 2, art: 'double-star' },
      { id: 'classic-fireball', name: 'Fireball', ability: 'blast', motion: 'sparkle', often: 1, image: '/classic/powerups/fireball.webp' },
      { id: 'classic-tornado', name: 'Tornado', ability: 'shuffle', motion: 'spin', often: 1, image: '/classic/powerups/tornado.webp' },
      { id: 'classic-prize-bag', name: 'Prize Bag', ability: 'bonus', amount: 100, motion: 'bob', often: 1, art: 'prize-bag' },
    ],
  },
  hasCpu: false,
  borrowedFrom: 'Dashboard src/routes/student/MatchThree3.tsx and src/lib/matchThree.ts',
};
