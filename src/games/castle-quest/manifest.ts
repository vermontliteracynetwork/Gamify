import type { GameManifest } from '../types';

// Kept apart from the game so the game list loads without loading every game.
// Board Game (teacher design, 2026-10-31; named "Board game" by the teacher):
// a hexagon trail race to the castle.
export const castleQuestManifest: GameManifest = {
  id: 'castle-quest',
  name: 'Board Game',
  description: 'Answer right, roll the die and hop along the winding forest trail. Cross bridges, grab power-ups and reach the castle first to build it!',
  modes: ['share', 'versus'],
  questionKinds: ['mc'],
  themePieces: [
    { id: 'background', label: 'Background', width: 1600, height: 1200, hint: 'Behind the board' },
    { id: 'tile', label: 'Trail space', width: 65, height: 89, hint: 'One hexagon space on the trail' },
    { id: 'castle', label: 'Castle', width: 240, height: 280, hint: 'The castle at the end of the path' },
    { id: 'die', label: 'Die', width: 128, height: 128, hint: 'The die you roll', color: '#fbfcf8' },
    ...Array.from({ length: 10 }, (_, i) => ({ id: `team-${i + 1}`, label: `Team ${i + 1} piece`, width: 256, height: 256, hint: `The piece for team ${i + 1}` })),
    { id: 'cover', label: 'Cover', width: 600, height: 600, hint: 'The picture on the game card' },
  ],
  // Classic roles (teacher, 2026-10-31); a theme can redraw each one.
  items: {
    label: 'Power-ups', hint: 'Found on the board. Give each one art and a power.', max: 7, width: 256, height: 256,
    abilities: [
      { id: 'magnet', label: 'Magnet', hint: 'On your next question, a magnet sticks to the right answer to help you.' },
      { id: 'tornado', label: 'Tornado', hint: 'Whoosh! Every player is blown to a new random space on the trail.' },
      { id: 'time', label: 'Stopwatch', hint: 'Your piece hops five times faster for your next 3 turns.' },
      { id: 'potion', label: 'Potion', hint: 'Your next roll of the die moves you three times as far.' },
      { id: 'chest', label: 'Treasure chest', hint: 'A surprise: it might move you ahead, give a roll again, or send you back a little.' },
      { id: 'shield', label: 'Shield', hint: 'For the next 3 rounds, nothing can push your piece back.' },
      { id: 'lightning', label: 'Lightning', hint: 'Pick another player: they roll the die and move back that many spaces.' },
    ],
    classic: [
      { id: 'classic-magnet', name: 'Magnet', ability: 'magnet', motion: 'wiggle', often: 1, image: '/classic/castle-quest/powerups/magnet.webp' },
      { id: 'classic-tornado', name: 'Tornado', ability: 'tornado', motion: 'spin', often: 1, image: '/classic/castle-quest/powerups/tornado.webp' },
      { id: 'classic-time', name: 'Stopwatch', ability: 'time', motion: 'wiggle', often: 1, image: '/classic/castle-quest/powerups/time.webp' },
      { id: 'classic-potion', name: 'Potion', ability: 'potion', motion: 'bob', often: 1, image: '/classic/castle-quest/powerups/potion.webp' },
      { id: 'classic-chest', name: 'Treasure Chest', ability: 'chest', motion: 'bob', often: 1, image: '/classic/castle-quest/powerups/chest.webp' },
      { id: 'classic-shield', name: 'Shield', ability: 'shield', motion: 'sparkle', often: 1, image: '/classic/castle-quest/powerups/shield.webp' },
      { id: 'classic-lightning', name: 'Lightning', ability: 'lightning', motion: 'sparkle', often: 1, image: '/classic/castle-quest/powerups/lightning.webp' },
    ],
  },
  hasCpu: true,
  borrowedFrom: 'New (teacher design, 2026-10-31)',
};
