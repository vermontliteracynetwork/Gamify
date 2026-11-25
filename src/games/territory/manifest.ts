import type { GameManifest } from '../types';

// Territory (teacher, 2026-11-24): a live invasion game. Pieces are named by
// their job so a theme can turn the cats and mice into anything (ships and
// aliens next): defenders, invaders, the entrance they come out of, the poof.
export const territoryManifest: GameManifest = {
  id: 'territory',
  name: 'Territory',
  description: 'Mice sneak out of the little wooden door into the room. Every right answer sends a cat to catch one. Catch them together, or play Cats against Mice for the room.',
  modes: ['live'],
  questionKinds: ['mc'],
  themePieces: [
    { id: 'background', label: 'Room', width: 1600, height: 1000, hint: 'The whole scene (a living room, space). Keep the bottom 40% clear: it is the floor the pieces stand on' },
    { id: 'entrance', label: 'Entrance', width: 200, height: 180, hint: 'Where invaders come in (a mouse hole, a portal). Sits on the floor line, right of center' },
    ...[1, 2, 3].map((n) => ({ id: `defender-${n}`, label: `Defender ${n}`, width: 256, height: 256, hint: 'One defender, feet at the bottom edge (a cat, a spaceship)' })),
    ...[1, 2, 3].map((n) => ({ id: `invader-${n}`, label: `Invader ${n}`, width: 256, height: 256, hint: 'One invader facing left, feet at the bottom edge (a mouse, an alien)' })),
    { id: 'cover', label: 'Cover', width: 600, height: 600, hint: 'The picture on the game card' },
  ],
  hasCpu: false,
};
