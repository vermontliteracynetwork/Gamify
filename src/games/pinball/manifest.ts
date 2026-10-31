import type { GameManifest } from '../types';

// Kept apart from the game so the game list loads without loading every game.
// Pinball replaced Peg Drop (teacher, 2026-10-31).
export const pinballManifest: GameManifest = {
  id: 'pinball',
  name: 'Pinball',
  description: 'Answer right, aim through a zone, fill the power bar and shoot the ball into a pocket of points.',
  modes: ['share', 'solo'],
  questionKinds: ['mc'],
  themePieces: [
    { id: 'background', label: 'Background', width: 1600, height: 1200, hint: 'Behind the table' },
    { id: 'board', label: 'Table', width: 1000, height: 1300, hint: 'The pinball table', color: '#314677' },
    { id: 'ball', label: 'Ball', width: 128, height: 128, hint: 'The pinball', color: '#e7ecf5' },
    { id: 'pocket', label: 'Pocket', width: 128, height: 128, hint: 'A scoring pocket (its points show on top)', color: '#fdfd94' },
    { id: 'bumper', label: 'Bumper', width: 128, height: 128, hint: 'The round bumpers that light up', color: '#f2735f' },
    { id: 'flipper', label: 'Flipper', width: 256, height: 96, hint: 'The two flippers by the launcher', color: '#fdfd94' },
    ...Array.from({ length: 10 }, (_, i) => ({ id: `team-${i + 1}`, label: `Team ${i + 1} icon`, width: 256, height: 256, hint: `The round badge for team ${i + 1}` })),
    { id: 'cover', label: 'Cover', width: 600, height: 600, hint: 'The picture on the game card' },
  ],
  rounds: { label: 'Rounds', min: 1, max: 10, default: 5 },
  items: {
    label: 'Power-ups', hint: 'Sometimes a right answer brings one. Give each one art and a power.', max: 6, width: 256, height: 256,
    abilities: [
      { id: 'super', label: 'Super shot', hint: 'The next shot always lands in a pocket' },
      { id: 'double', label: 'Doubles the next shot', hint: 'The pocket the ball lands in counts twice' },
      { id: 'bonus', label: 'Bonus points', hint: 'Points right away', amount: { label: 'Points', min: 10, max: 200, step: 10, default: 50 } },
    ],
    classic: [
      { id: 'classic-super-shooter', name: 'Super Shooter', ability: 'super', motion: 'sparkle', often: 2, art: 'super-shooter' },
      { id: 'classic-golden-ball', name: 'Golden Ball', ability: 'double', motion: 'sparkle', often: 1, art: 'golden-ball' },
      { id: 'classic-prize-bag', name: 'Prize Bag', ability: 'bonus', amount: 50, motion: 'bob', often: 2, art: 'prize-bag' },
    ],
  },
  hasCpu: true,
  borrowedFrom: 'New (teacher design, 2026-10-31); replaces Peg Drop',
};
