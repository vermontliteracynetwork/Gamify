import type { GameManifest } from '../types';

// Kept apart from the game so the game list loads without loading every game.
export const lunchRushManifest: GameManifest = {
  id: 'lunch-rush',
  name: 'Lunch Rush',
  description: 'Answer right to earn serves, then bring each hungry guest the food they want.',
  modes: ['share', 'solo'],
  questionKinds: ['mc'],
  themePieces: [
    { id: 'background', label: 'Wall', width: 1500, height: 1000, hint: 'The wall behind the counter', color: '#fde2c4' },
    { id: 'counter', label: 'Counter', width: 1500, height: 300, hint: 'The color of the counter', color: '#ed9d75' },
    { id: 'food-pizza', label: 'Food 1 (pizza)', width: 256, height: 256, hint: 'The first food guests order', color: '#f6c544' },
    { id: 'food-burger', label: 'Food 2 (burger)', width: 256, height: 256, hint: 'The second food guests order', color: '#f39a6b' },
    { id: 'food-icecream', label: 'Food 3 (ice cream)', width: 256, height: 256, hint: 'The third food guests order', color: '#f6a5c0' },
    { id: 'food-carrot', label: 'Food 4 (carrot)', width: 256, height: 256, hint: 'The fourth food guests order', color: '#9bd35a' },
    ...[1, 2, 3].map((n) => ({ id: `guest-${n}`, label: `Guest ${n}`, width: 256, height: 320, hint: 'A guest at the counter, head and shoulders' })),
    ...Array.from({ length: 10 }, (_, i) => ({ id: `team-${i + 1}`, label: `Team ${i + 1} icon`, width: 256, height: 256, hint: `The round badge for team ${i + 1}` })),
    { id: 'cover', label: 'Cover', width: 600, height: 600, hint: 'The picture on the game card' },
  ],
  rounds: { label: 'Questions', min: 2, max: 15, default: 6 },
  items: {
    label: 'Power-ups', hint: 'Sometimes a right answer brings one. Give each one art and a power.', max: 6, width: 256, height: 256,
    abilities: [
      { id: 'serves', label: 'More serves', hint: 'Extra serves this turn', amount: { label: 'Serves', min: 1, max: 3, step: 1, default: 1 } },
      { id: 'bonus', label: 'Bonus tips', hint: 'Points right away', amount: { label: 'Points', min: 1, max: 20, step: 1, default: 5 } },
      { id: 'double', label: 'Double tips', hint: 'Every serve this turn scores twice' },
    ],
    classic: [
      { id: 'classic-extra-plate', name: 'Extra Plate', ability: 'serves', amount: 1, motion: 'bob', often: 2, art: 'extra-plate' },
      { id: 'classic-tip-jar', name: 'Tip Jar', ability: 'bonus', amount: 5, motion: 'wiggle', often: 1, art: 'tip-jar' },
      { id: 'classic-double-star', name: 'Double Star', ability: 'double', motion: 'sparkle', often: 1, art: 'double-star' },
    ],
  },
  hasCpu: true,
};
