import type { Question } from '../data/types';
import type { ThemePieceSpec } from '../theme/types';

// The game module contract (product plan section 7). Every game is a
// plug-in that declares these; nothing about questions lives in the game.

export type PlayMode = 'live' | 'share' | 'solo' | 'versus';

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
  rounds?: RoundSetting;
  questionsPerBreak?: RoundSetting;
  // Versus and Share games that can play against a computer player.
  hasCpu: boolean;
  // Dashboard file the logic is borrowed from (development plan Part 4A).
  borrowedFrom?: string;
}
