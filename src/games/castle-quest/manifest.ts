import type { GameManifest } from '../types';

// Kept apart from the game so the game list loads without loading every game.
// Board Game (teacher redesign, 2026-11-08): a flat classic board of square
// spaces, Start to Finish. Answer, roll, move; first to the end wins.
export const castleQuestManifest: GameManifest = {
  id: 'castle-quest',
  name: 'Board Game',
  description: 'Answer right, roll the die and move that many squares. Watch for lose-a-turn and roll-again squares, find hidden power-ups, and be first to the finish!',
  modes: ['share', 'versus'],
  questionKinds: ['mc'],
  // Everything is designable (teacher, 2026-11-08): each kind of square, all
  // six sides of the die on one page, the background and every power-up.
  themePieces: [
    { id: 'background', label: 'Background', width: 1600, height: 1200, hint: 'Behind the board' },
    { id: 'space', label: 'Regular square', width: 256, height: 256, hint: 'Most squares on the board. Square, 1 to 1.' },
    { id: 'space-lose', label: 'Lose a turn square', width: 256, height: 256, hint: 'Land here and skip your next turn. Square, 1 to 1.' },
    { id: 'space-again', label: 'Roll again square', width: 256, height: 256, hint: 'Land here and roll one more time. Square, 1 to 1.' },
    { id: 'start', label: 'Start square', width: 256, height: 256, hint: 'Where every piece begins. Square, 1 to 1.' },
    { id: 'finish', label: 'Finish square', width: 256, height: 256, hint: 'The last square. First one here wins. Square, 1 to 1.' },
    { id: 'dice', label: 'Die (all six sides)', width: 1536, height: 256, hint: 'One page with all six sides in a row, 1 to 6 from left to right. Draw the dots your way, but each side keeps its number of dots.' },
    ...Array.from({ length: 10 }, (_, i) => ({ id: `team-${i + 1}`, label: `Team ${i + 1} piece`, width: 256, height: 256, hint: `The round piece for team ${i + 1}` })),
    { id: 'cover', label: 'Cover', width: 600, height: 600, hint: 'The picture on the game card' },
    { id: 'title', label: 'Title', width: 1200, height: 360, hint: 'The theme name in your own lettering (shown on the theme card)' },
  ],
  // Classic roles (teacher, 2026-11-08): basic in look and action; a theme
  // can redraw each one.
  items: {
    label: 'Power-ups', hint: 'Hidden on the board. Give each one art and a power.', max: 6, width: 256, height: 256,
    abilities: [
      { id: 'double', label: 'Double roll', hint: 'On your next turn you roll twice and move both rolls.' },
      { id: 'x2', label: '2x', hint: 'On your next turn your roll counts double.' },
      { id: 'tornado', label: 'Tornado', hint: 'Whoosh! Every player is lifted, swirled and dropped on new squares, evenly spread out.' },
      { id: 'wheel', label: 'Wheel', hint: 'On your next turn, pick a player and roll. The wheel decides: they move forward or back that many squares.' },
      { id: 'potion', label: 'Potion', hint: 'Your next two rolls count double.' },
      { id: 'shield', label: 'Shield', hint: 'From now until your next turn starts, other players\' power-ups cannot touch you.' },
    ],
    classic: [
      { id: 'classic-double', name: 'Double Roll', ability: 'double', motion: 'wiggle', often: 1, art: 'two-dice' },
      { id: 'classic-x2', name: '2x', ability: 'x2', motion: 'sparkle', often: 1, art: 'double-star' },
      { id: 'classic-tornado', name: 'Tornado', ability: 'tornado', motion: 'wiggle', often: 1, art: 'twister' },
      { id: 'classic-wheel', name: 'Wheel', ability: 'wheel', motion: 'spin', often: 1, art: 'spin-wheel' },
      { id: 'classic-potion', name: 'Potion', ability: 'potion', motion: 'bob', often: 1, art: 'magic-potion' },
      { id: 'classic-shield', name: 'Shield', ability: 'shield', motion: 'sparkle', often: 1, art: 'round-shield' },
    ],
  },
  hasCpu: true,
  borrowedFrom: 'New (teacher design, 2026-10-31; classic board redesign 2026-11-08)',
};
