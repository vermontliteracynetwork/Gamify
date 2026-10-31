import type { GameManifest } from '../types';

// Kept apart from the game so the game list loads without loading every game.
// Castle Quest (teacher design, 2026-10-31): a hexagon board race to the castle.
export const castleQuestManifest: GameManifest = {
  id: 'castle-quest',
  name: 'Castle Quest',
  description: 'Answer right, roll the die and hop along the forest path. Cross bridges, grab power-ups and reach the castle first!',
  modes: ['share', 'versus'],
  questionKinds: ['mc'],
  themePieces: [
    { id: 'background', label: 'Background', width: 1600, height: 1200, hint: 'Behind the board' },
    { id: 'tile', label: 'Path tile', width: 65, height: 89, hint: 'One hexagon tile on the path' },
    { id: 'castle', label: 'Castle', width: 240, height: 280, hint: 'The castle at the end of the path' },
    { id: 'die', label: 'Die', width: 128, height: 128, hint: 'The die you roll', color: '#fbfcf8' },
    ...Array.from({ length: 10 }, (_, i) => ({ id: `team-${i + 1}`, label: `Team ${i + 1} piece`, width: 256, height: 256, hint: `The piece for team ${i + 1}` })),
    { id: 'cover', label: 'Cover', width: 600, height: 600, hint: 'The picture on the game card' },
  ],
  // Classic roles (teacher, 2026-10-31); a theme can redraw each one.
  items: {
    label: 'Power-ups', hint: 'Found on the board. Give each one art and a power.', max: 7, width: 256, height: 256,
    abilities: [
      { id: 'magnet', label: 'Magnet', hint: 'On your next question, a magnet sticks to the right answer' },
      { id: 'tornado', label: 'Tornado', hint: 'Whoosh! Every player lands on a new random tile' },
      { id: 'time', label: 'Time', hint: 'Your piece hops 5 times faster for 3 turns' },
      { id: 'potion', label: 'Potion', hint: 'Your next roll moves 3 times as far' },
      { id: 'chest', label: 'Treasure chest', hint: 'A surprise: good or not so good!' },
      { id: 'shield', label: 'Shield', hint: 'Nothing can push you back for 3 rounds' },
      { id: 'lightning', label: 'Lightning', hint: 'Send another player back a roll of the die' },
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
