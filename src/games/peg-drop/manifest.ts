import type { GameManifest } from '../types';

// Kept apart from the game so the game list loads without loading every game.
export const pegDropManifest: GameManifest = {
  id: 'peg-drop',
  name: 'Peg Drop',
  description: 'Answer right, pick a spot, and drop the ball through the pegs into a bucket of points.',
  modes: ['share', 'solo'],
  questionKinds: ['mc'],
  themePieces: [
    { id: 'background', label: 'Background', width: 1600, height: 1200, hint: 'Behind the board' },
    { id: 'board', label: 'Board', width: 1000, height: 1200, hint: 'The board the pegs sit on', color: '#314677' },
    { id: 'ball', label: 'Ball', width: 128, height: 128, hint: 'The ball that drops', color: '#fdfd94' },
    { id: 'peg', label: 'Peg', width: 64, height: 64, hint: 'One peg', color: '#fbfcf8' },
    { id: 'bucket', label: 'Bucket', width: 200, height: 120, hint: 'A bucket of 10 or 50 points at the bottom', color: '#fbfcf8' },
    { id: 'bucket-big', label: 'Big bucket', width: 200, height: 120, hint: 'The 100 point bucket', color: '#ed9d75' },
    ...Array.from({ length: 10 }, (_, i) => ({ id: `team-${i + 1}`, label: `Team ${i + 1} icon`, width: 256, height: 256, hint: `The round badge for team ${i + 1}` })),
    { id: 'cover', label: 'Cover', width: 600, height: 600, hint: 'The picture on the game card' },
  ],
  rounds: { label: 'Rounds', min: 1, max: 10, default: 3 },
  items: {
    label: 'Power-ups', hint: 'Sometimes a right answer brings one. Give each one art and a power.', max: 6, width: 256, height: 256,
    abilities: [
      { id: 'double', label: 'Doubles the next drop', hint: 'The bucket the ball lands in counts twice' },
      { id: 'bonus', label: 'Bonus points', hint: 'Points right away', amount: { label: 'Points', min: 10, max: 200, step: 10, default: 50 } },
      { id: 'extra', label: 'One more drop', hint: 'Drop again without a question' },
    ],
    classic: [
      { id: 'classic-golden-ball', name: 'Golden Ball', ability: 'double', motion: 'sparkle', often: 1, art: 'golden-ball' },
      { id: 'classic-prize-bag', name: 'Prize Bag', ability: 'bonus', amount: 50, motion: 'bob', often: 2, art: 'prize-bag' },
      { id: 'classic-twin-ball', name: 'Twin Ball', ability: 'extra', motion: 'wiggle', often: 1, art: 'extra-ball' },
    ],
  },
  hasCpu: true,
  borrowedFrom: 'Dashboard src/routes/student/PlinkoDrop.tsx (Plinko), rebuilt',
};
