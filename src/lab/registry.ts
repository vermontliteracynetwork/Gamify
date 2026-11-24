import type { PlayMode } from '../data/types';
import type { LabDef } from './types';

// Every Game Lab game is a folder in ./games with a meta.ts (name and family,
// loaded with the list) and a Game.tsx (the game, loaded when opened). A new
// folder shows up in /lab on its own.
export type LabFamily = 'Quiz boards' | 'Word games' | 'Arcade answers' | 'Team shows' | 'Classic arcade' | 'Quest and build';
export interface LabMeta { id: string; name: string; family: LabFamily; blurb: string; order?: number }

const metas = import.meta.glob<{ meta: LabMeta }>('./games/*/meta.ts', { eager: true });
const games = import.meta.glob<{ default: LabDef }>('./games/*/Game.tsx');

export const FAMILIES: LabFamily[] = ['Quiz boards', 'Word games', 'Arcade answers', 'Team shows', 'Classic arcade', 'Quest and build'];
export const LAB_GAMES: LabMeta[] = Object.values(metas).map((m) => m.meta).sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || a.name.localeCompare(b.name));

export function loadLabGame(id: string): Promise<LabDef> | null {
  const load = games[`./games/${id}/Game.tsx`];
  return load ? load().then((m) => m.default) : null;
}

// Each game's own ways to play (teacher, 2026-11-23: "not all games can be
// every game type"): Share = teams take turns on one screen, Versus = two
// players or the computer on one device, Solo = one player, Live = every
// student on their own device with the big screen (planned, not built yet).
// Real-time arcade games are Solo and Live only; turn games are Share and
// Versus. The setup's first page offers only these.
export const LAB_MODES: Record<string, PlayMode[]> = {
  'balloon-pop': ['solo'],
  'bingo': ['share', 'solo'],
  'block-drop': ['solo'],
  'code-crackers': ['share', 'solo'],
  'crossword': ['share', 'solo'],
  'dots-boxes': ['share', 'solo'],
  'fruit-fling': ['solo'],
  'gem-sweep': ['solo'],
  'goal-kick': ['share', 'solo'],
  'home-run': ['share', 'solo'],
  'hoop-shot': ['share', 'solo'],
  'jump-quest': ['solo'],
  'lane-hop': ['solo'],
  'letter-lock': ['share', 'solo'],
  'maze-dash': ['solo'],
  'mole-bop': ['solo'],
  'pixel-blaster': ['solo'],
  'prize-crane': ['share', 'solo'],
  'sky-flyer': ['solo'],
  'snakes-ladders': ['share', 'solo'],
  'snow-pal': ['share', 'solo'],
  'sort-rush': ['solo'],
  'spot-match': ['solo'],
  'survey-showdown': ['share'],
  'team-tug': ['share', 'solo'],
  'tic-tac-toe': ['share', 'solo'],
  'touchdown': ['share', 'solo'],
  'tower-guard': ['share', 'solo'],
  'toy-factory': ['share', 'solo'],
  'track-race': ['share', 'solo'],
  'treasure-quest': ['share', 'solo'],
  'unscramble': ['share', 'solo'],
  'word-search': ['share', 'solo'],
};
// Planned Live formats (not shown until a game has a real student-facing
// live view, teacher 2026-11-23).
export const LIVE_PLAN: Record<string, string> = {
  'balloon-pop': 'Class race: every student plays on their own device; the big screen shows the class progress',
  'bingo': 'Class game: each student has their own card on their device; the big screen calls the balls',
  'block-drop': 'Class race: every student plays on their own device; the big screen shows the class progress',
  'code-crackers': 'Class race: each student cracks codes on their device; the big screen shows the server towers',
  'crossword': 'Class race: every student plays on their own device; the big screen shows the class progress',
  'dots-boxes': 'Two halves of the class: right answers earn lines for your half of the room',
  'fruit-fling': 'Class race: every student plays on their own device; the big screen shows the class progress',
  'gem-sweep': 'Class race: every student plays on their own device; the big screen shows the class progress',
  'goal-kick': 'Class team: right answers on every device earn kicks on the big screen',
  'home-run': 'Class team: right answers on every device fill the bat meter; the big screen swings',
  'hoop-shot': 'Class team: right answers on every device earn shots on the big screen',
  'jump-quest': 'Class race: every student plays on their own device; the big screen shows the class progress',
  'lane-hop': 'Class race: every student plays on their own device; the big screen shows the class progress',
  'letter-lock': 'Class race: every student plays on their own device; the big screen shows the class progress',
  'maze-dash': 'Class race: every student plays on their own device; the big screen shows the class progress',
  'mole-bop': 'Class race: every student plays on their own device; the big screen shows the class progress',
  'pixel-blaster': 'Class race: every student plays on their own device; the big screen shows the class progress',
  'prize-crane': 'Class race: every student plays on their own device; the big screen shows the class progress',
  'sky-flyer': 'Class race: every student plays on their own device; the big screen shows the class progress',
  'snakes-ladders': 'Class race: every student is a piece on the big screen board',
  'snow-pal': 'Class goal: the class saves one snow friend together; each right answer on a device guesses a letter',
  'sort-rush': 'Class race: every student plays on their own device; the big screen shows the class progress',
  'spot-match': 'Class race: every student plays on their own device; the big screen shows the class progress',
  'survey-showdown': 'Class show: everyone answers on their device; the big screen flips the top answers',
  'team-tug': 'Two halves of the class: right answers on every device pull the rope on the big screen',
  'tic-tac-toe': 'Two halves of the class: each half votes its square on their devices',
  'touchdown': 'Class team: right answers on every device move the class down the field',
  'tower-guard': 'Class goal: the whole class defends one cake; every right answer anywhere builds a tower on the big screen',
  'toy-factory': 'Class goal: every right answer adds a machine to one class factory on the big screen',
  'track-race': 'Class race: every student is a runner on the big screen; right answers roll the die',
  'treasure-quest': 'Class race: each student opens chests on their device; the big screen shows the gold piles',
  'unscramble': 'Class race: every student plays on their own device; the big screen shows the class progress',
  'word-search': 'Class race: every student plays on their own device; the big screen shows the class progress',
};
