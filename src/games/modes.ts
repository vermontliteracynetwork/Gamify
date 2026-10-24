import { ALL_MODES, type Classroom, type PlayMode, type Student } from '../data/types';
import type { GameManifest } from './types';

// Which play modes a student sees for a game: the game's own modes, limited
// by the teacher's choice for the class and then for that student
// (teacher setting on every plan, 2026-10-24).
export function visibleModes(game: GameManifest, classroom?: Classroom, student?: Student): PlayMode[] {
  const classModes = classroom?.allowedModes ?? ALL_MODES;
  const studentModes = student?.allowedModes ?? ALL_MODES;
  return game.modes.filter((m) => classModes.includes(m) && studentModes.includes(m));
}
