import type { GameManifest } from '../types';

// Kept apart from the game so the game list loads without loading every game.
export const castleGuardManifest: GameManifest = {
  id: 'castle-guard',
  name: 'Castle Guard',
  description: 'Answer questions to earn gems, build bubble towers by the road, and send the sneaky critters back home.',
  modes: ['solo'],
  questionKinds: ['mc'],
  themePieces: [
    { id: 'background', label: 'Background', width: 1600, height: 1024, hint: 'The grass and trees around the road', color: '#9fd88a' },
    { id: 'road', label: 'Road', width: 400, height: 400, hint: 'The color of the road', color: '#e8c48f' },
    { id: 'castle', label: 'Castle', width: 400, height: 400, hint: 'The castle at the end of the road' },
    { id: 'tower-bubble', label: 'Bubble tower', width: 256, height: 320, hint: 'Tosses one big bubble at a time' },
    { id: 'tower-splash', label: 'Splash tower', width: 256, height: 320, hint: 'Splashes every critter near it' },
    { id: 'tower-snow', label: 'Snow tower', width: 256, height: 320, hint: 'Slows critters down' },
    ...[1, 2, 3].map((n) => ({ id: `critter-${n}`, label: `Critter ${n}`, width: 192, height: 192, hint: 'A sneaky (friendly) critter walking to the castle' })),
    { id: 'gem', label: 'Gem', width: 128, height: 128, hint: 'What right answers earn', color: '#8ec5ff' },
    { id: 'cover', label: 'Cover', width: 600, height: 600, hint: 'The picture on the game card' },
  ],
  items: {
    label: 'Power-ups', hint: 'Sometimes a right answer brings one. Give each one art and a power.', max: 6, width: 256, height: 256,
    abilities: [
      { id: 'gems', label: 'Extra gems', hint: 'Gems right away', amount: { label: 'Gems', min: 1, max: 10, step: 1, default: 3 } },
      { id: 'slow', label: 'Slower wave', hint: 'The next wave walks slowly' },
      { id: 'bonus', label: 'Bonus points', hint: 'Points right away', amount: { label: 'Points', min: 1, max: 20, step: 1, default: 5 } },
    ],
    classic: [
      { id: 'classic-gem-pouch', name: 'Gem Pouch', ability: 'gems', amount: 3, motion: 'bob', often: 2, art: 'gem-pouch' },
      { id: 'classic-snow-globe', name: 'Snow Globe', ability: 'slow', motion: 'sparkle', often: 1, art: 'snow-globe' },
      { id: 'classic-prize-bag', name: 'Prize Bag', ability: 'bonus', amount: 5, motion: 'bob', often: 1, art: 'prize-bag' },
    ],
  },
  rounds: { label: 'Waves', min: 3, max: 8, default: 5 },
  questionsPerBreak: { label: 'Questions before each wave', min: 1, max: 4, default: 2 },
  hasCpu: false,
  borrowedFrom: 'Dashboard src/routes/student/CastleDefense.tsx (logic only; art drawn in code)',
};
