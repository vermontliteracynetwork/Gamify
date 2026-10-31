import { classicTheme } from './classic';
import type { GameTheme } from './types';

// Themes designed by Gamify from licensed art packs (teacher, 2026-10-31).
// They play like library themes (Plus and Pro) and are offered on each
// game's theme step next to Classic. Every pack is in docs/asset-ledger.md.
function house(gameId: string, id: string, name: string, change: (base: GameTheme) => Partial<GameTheme>): GameTheme {
  const base = classicTheme(gameId);
  const extra = change(base);
  return { ...base, ...extra, colors: { ...base.colors, ...extra.colors }, fonts: { ...base.fonts, ...extra.fonts }, pieces: { ...base.pieces, ...extra.pieces }, id: `house:${id}`, name, source: 'library', designedBy: 'Gamify' };
}

const ANIMALS = ['panda', 'penguin', 'monkey', 'elephant', 'giraffe', 'hippo', 'parrot', 'pig', 'rabbit', 'snake'];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const HOUSE_THEMES: GameTheme[] = [
  // Four in a Row: Animal Friends, ten round animals from Kenney's Animal Pack (CC0).
  house('four-in-a-row', 'animal-friends', 'Animal Friends', () => ({
    colors: { background: '#9fd88a' } as GameTheme['colors'],
    backdrop: { kind: 'pattern', pattern: 'dots' },
    pieces: { board: { color: '#f7d488' } },
    discs: ANIMALS.map((a) => ({ id: a, name: cap(a), image: `/themes/animals/${a}.webp` })),
  })),
  // Match Three: Christmas Treats, from TrulyMalicious's Christmas Set #1 (CC BY 4.0, credited).
  house('match-three', 'christmas-treats', 'Christmas Treats', () => ({
    colors: { background: '#1f6f4a', backgroundText: '#ffffff' } as GameTheme['colors'],
    backdrop: { kind: 'pattern', pattern: 'dots' },
    pieces: {
      board: { color: '#f7fbff' },
      ...Object.fromEntries([['candy-cane', 'Candy cane', '#ffe3e3'], ['tree', 'Christmas tree', '#dff5df'], ['gingerbread', 'Gingerbread', '#f4e3cf'], ['snowflake', 'Snowflake', '#dcefff'], ['bell', 'Bell', '#fff3c4'], ['ornament', 'Ornament', '#d9f4f1']]
        .map(([file, alt, color], i) => [`tile-${i}`, { image: `/themes/christmas/${file}.webp`, alt, color }])),
      cover: { image: '/themes/christmas/present.webp', color: '#1f6f4a' },
    },
  })),
  // Question Tracker: Pet Room, Nasha's Cozy Pets Pack (free for commercial
  // use in a game; never handed out as art files). A pet joins the room for
  // every right answer (teacher, 2026-10-31).
  house('star-quiz', 'pet-room', 'Pet Room', () => ({
    colors: { background: '#e9c79a', backgroundText: '#000000' } as GameTheme['colors'],
    pieces: { background: { image: '/themes/pets/room.webp' }, cover: { image: '/themes/pets/room.webp', color: '#e9c79a' } },
    itemImages: ['/themes/pets/black_and_white_tuxedo_cat.webp', '/themes/pets/corgi_sitting.webp', '/themes/pets/budgie_on_a_perch_stand.webp', '/themes/pets/black_kitten_peeking_out_of_a_cardboard_box.webp', '/themes/pets/dachshund.webp', '/themes/pets/guinea_pig.webp', '/themes/pets/calico_kitten_playing_with_a_ball_of_yarn.webp', '/themes/pets/dalmatian_puppy.webp', '/themes/pets/hamster_eating_a_seed.webp', '/themes/pets/fluffy_white_persian_cat.webp', '/themes/pets/fluffy_white_poodle.webp', '/themes/pets/little_turtle.webp', '/themes/pets/grey_cat_sleeping_curled_up.webp', '/themes/pets/golden_retriever_lying_down.webp', '/themes/pets/lop_eared_bunny.webp', '/themes/pets/orange_tabby_cat_sitting.webp', '/themes/pets/husky_puppy.webp', '/themes/pets/siamese_cat.webp', '/themes/pets/pug.webp', '/themes/pets/shiba_inu.webp'],
    room: { floor: 57 },
    pixelArt: true,
  })),
];

export const houseFor = (gameId: string) => HOUSE_THEMES.filter((th) => th.gameId === gameId);
