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

// Ways to play (Gamify's game types): Share and Versus for every team game,
// Solo where the game has a solo mode, and a planned Live format for each
// game (teacher, 2026-11-23: be creative about how they can be live,
// collaborative and competitive). Live is planned, not built yet.
export const LAB_MODES: Record<string, PlayMode[]> = {
  'balloon-pop': ['share', 'versus', 'solo', 'live'],
  'bingo': ['share', 'versus', 'solo', 'live'],
  'block-drop': ['share', 'versus', 'solo', 'live'],
  'code-crackers': ['share', 'versus', 'solo', 'live'],
  'crossword': ['share', 'versus', 'solo', 'live'],
  'dots-boxes': ['share', 'versus', 'live'],
  'fruit-fling': ['share', 'versus', 'solo', 'live'],
  'gem-sweep': ['share', 'versus', 'solo', 'live'],
  'goal-kick': ['share', 'versus', 'solo', 'live'],
  'home-run': ['share', 'versus', 'solo', 'live'],
  'hoop-shot': ['share', 'versus', 'solo', 'live'],
  'jump-quest': ['share', 'versus', 'solo', 'live'],
  'lane-hop': ['share', 'versus', 'solo', 'live'],
  'letter-lock': ['share', 'versus', 'solo', 'live'],
  'maze-dash': ['share', 'versus', 'solo', 'live'],
  'mole-bop': ['share', 'versus', 'solo', 'live'],
  'pixel-blaster': ['share', 'versus', 'solo', 'live'],
  'prize-crane': ['share', 'versus', 'solo', 'live'],
  'sky-flyer': ['share', 'versus', 'solo', 'live'],
  'snakes-ladders': ['share', 'versus', 'live'],
  'snow-pal': ['share', 'versus', 'solo', 'live'],
  'sort-rush': ['share', 'versus', 'solo', 'live'],
  'spot-match': ['share', 'versus', 'solo', 'live'],
  'survey-showdown': ['share', 'versus', 'live'],
  'team-tug': ['share', 'versus', 'solo', 'live'],
  'tic-tac-toe': ['share', 'versus', 'live'],
  'touchdown': ['share', 'versus', 'solo', 'live'],
  'tower-guard': ['share', 'versus', 'solo', 'live'],
  'toy-factory': ['share', 'versus', 'solo', 'live'],
  'track-race': ['share', 'versus', 'live'],
  'treasure-quest': ['share', 'versus', 'solo', 'live'],
  'unscramble': ['share', 'versus', 'solo', 'live'],
  'word-search': ['share', 'versus', 'solo', 'live'],
};
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
