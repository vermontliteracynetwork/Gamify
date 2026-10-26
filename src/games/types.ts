import type { Question } from '../data/types';
import type { ItemSlotsSpec, ThemePieceSpec } from '../theme/types';

// The game module contract (product plan section 7). Every game is a
// plug-in that declares these; nothing about questions lives in the game.

import type { PlayMode } from '../data/types';

export type { PlayMode };

export interface RoundSetting {
  label: string;
  min: number;
  max: number;
  default: number;
}

export interface GameManifest {
  id: string;
  name: string;
  description: string;
  modes: PlayMode[];
  questionKinds: Question['kind'][];
  // The pieces a theme for this game can design (themes are per game).
  themePieces: ThemePieceSpec[];
  // Power-up items a theme can add, and the abilities this game's code can do.
  items?: ItemSlotsSpec;
  rounds?: RoundSetting;
  questionsPerBreak?: RoundSetting;
  // Versus and Share games that can play against a computer player.
  hasCpu: boolean;
  // Dashboard file the logic is borrowed from (development plan Part 4A).
  borrowedFrom?: string;
}
