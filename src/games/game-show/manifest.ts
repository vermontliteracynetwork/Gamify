import type { GameManifest } from '../types';

// Kept apart from the game so the game list loads without loading every game.
export const gameShowManifest: GameManifest = {
  id: 'game-show',
  name: 'Game Show',
  description: 'Teams take turns on the big screen. Answer right to pick a card (some hold power-ups) or a square.',
  modes: ['share'],
  questionKinds: ['mc'],
  themePieces: [
    { id: 'background', label: 'Background', width: 1920, height: 1080, hint: 'Behind the whole board' },
    { id: 'card-back', label: 'Card back', width: 300, height: 220, hint: 'The front of each surprise card before it flips', color: '#fdfd94' },
    { id: 'square', label: 'Grid square', width: 300, height: 180, hint: 'One square of the category grid', color: '#fdfd94' },
    ...Array.from({ length: 10 }, (_, i) => ({ id: `team-${i + 1}`, label: `Team ${i + 1} icon`, width: 256, height: 256, hint: `The round badge for team ${i + 1}` })),
    { id: 'cover', label: 'Cover', width: 600, height: 600, hint: 'The picture on the game card' },
  ],
  items: {
    label: 'Power-ups', hint: 'Cards that do something special when a team turns them over. Give each one art and a power.', max: 6, width: 256, height: 256,
    abilities: [
      { id: 'double', label: 'Doubles your points', hint: "The team's score doubles" },
      { id: 'swap', label: 'Swap points', hint: 'Trade scores with a team you pick' },
      { id: 'steal', label: 'Steal points', hint: 'Take points from a team you pick', amount: { label: 'Points', min: 10, max: 100, step: 10, default: 20 } },
      { id: 'bonus', label: 'Bonus points', hint: 'A big prize of points', amount: { label: 'Points', min: 10, max: 200, step: 10, default: 100 } },
    ],
    classic: [
      { id: 'classic-double', name: 'Double Star', ability: 'double', motion: 'sparkle', often: 1, art: 'double-star' },
      { id: 'classic-swap', name: 'Swap Spinner', ability: 'swap', motion: 'spin', often: 1, art: 'swap-arrows' },
      { id: 'classic-steal', name: 'Sneaky Magnet', ability: 'steal', amount: 20, motion: 'wiggle', often: 1, art: 'magnet' },
      { id: 'classic-bonus', name: 'Prize Bag', ability: 'bonus', amount: 100, motion: 'bob', often: 1, art: 'prize-bag' },
    ],
  },
  hasCpu: true,
  borrowedFrom: 'Dashboard team games (Plinko turns) and Baamboozle-style rules, rebuilt',
};
