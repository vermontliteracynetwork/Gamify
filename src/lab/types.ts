import type { ComponentType, ReactNode } from 'react';
import type { MultipleChoiceQuestion } from '../data/types';
import type { CpuLevel, TurnPlayer, TurnState } from '../engine/turns';
import type { PlayerSettings } from '../settings/settings';
import type { Sfx } from './sfx';
import type { WordPair } from './words';

// The Game Lab (teacher, 2026-11-22): new games built from scratch on the
// shared engine, inspired by the rules of well-loved classroom and arcade
// games (never their code, art, sounds or names). They live on the preview
// branch only and are reached from /lab, not from the main game list.

// A power-up: its own picture, name and plain-words role. `silly` ones are
// the funny "oops" kind (fair, never mean) and land at once.
export interface LabPower {
  id: string;
  name: string;
  desc: string;
  art: ReactNode;
  silly?: boolean;
  // A power-up that takes, steals or swaps points (never comes up when the
  // players it would hit have no points, teacher 2026-11-01).
  takes?: boolean;
  // How it arrives on its card.
  enter?: 'spin' | 'drop' | 'zoom' | 'wiggle';
}

export interface LabHowStep { icon: ReactNode; text: string }

// A piece a user's theme can redesign later (Classic is drawn in code).
export interface LabPiece { id: string; label: string; hint: string }

export interface LabDef {
  id: string;
  name: string;
  description: string;
  // Teams take turns on one screen, or one player plays alone.
  ways: ('teams' | 'solo')[];
  how: LabHowStep[];
  rounds: { label: string; min: number; max: number; default: number };
  minTeams?: number;
  maxTeams?: number;
  powers: LabPower[];
  // The Classic stage behind the board (CSS background).
  background: string;
  cover: ReactNode;
  pieces: LabPiece[];
  // 'questions': multiple choice questions earn moves. 'words': the answers
  // of the set become the words of the game (hangman, word search...).
  uses?: 'questions' | 'words';
  Play: ComponentType<{ ctx: LabCtx }>;
}

export interface LabCtx {
  def: LabDef;
  solo: boolean;
  still: boolean;
  settings: PlayerSettings;
  turns: TurnState;
  player: TurnPlayer;
  // The teacher's Timers setting for clocks in a game: 1 = normal, 1.5 =
  // relaxed, 0 = no clock (end the burst by a count or goal instead).
  timeScale: number;
  // Screen shake allowed (the Screen shake setting).
  shake: boolean;
  // The current player is the computer: the game makes its move for it.
  cpu: boolean;
  cpuLevel: CpuLevel;
  // True as often as the computer's level would get things right.
  cpuRight: () => boolean;
  // 1-based round, and how many the teacher picked.
  round: number;
  rounds: number;
  // Turns taken so far (every player's turn counts one).
  taken: number;
  // One question for the current player: true on a right answer. Solo
  // keeps asking until a right answer (a miss never costs anything).
  ask: () => Promise<boolean>;
  // Draw a question without showing the question screen (games where the
  // answers sit on the board: balloons, moles, fruit, a maze).
  draw: () => MultipleChoiceQuestion;
  // Log an answer the game checked itself, and count it for review.
  log: (q: MultipleChoiceQuestion, right: boolean) => void;
  // Points for the current player (or the one named). Never below zero.
  points: (n: number, playerId?: string) => void;
  // Set every score at once (swaps, steals).
  setScores: (scores: Record<string, number>) => void;
  // End this player's turn. Ends the game (and returns false) once every
  // round is played.
  next: () => boolean;
  finish: (title?: string) => void;
  // After a right answer: sometimes a power-up. Shows its card and resolves
  // once it is closed with the power-up (or null when none came).
  power: (chance?: number, allow?: (p: LabPower) => boolean) => Promise<LabPower | null>;
  // Show a given power-up's card (when the board itself hands one out).
  showPower: (p: LabPower, text?: string) => Promise<void>;
  // A big message in the middle of the screen, on top of everything.
  say: (text: string, tone?: 'good' | 'oops' | 'big') => void;
  // Confetti; x and y are 0..1 of the screen.
  burst: (x?: number, y?: number, size?: 'small' | 'big') => void;
  sfx: Sfx;
  // The words of the picked sets (answers with their questions as clues).
  words: (opts?: { min?: number; max?: number; length?: number }) => WordPair[];
  // Power-ups this player holds, shown under the score board.
  setHeld: (playerId: string, powers: LabPower[]) => void;
  held: Record<string, LabPower[]>;
  // A small status line or meter under the score board (hearts, lives...).
  setStatus: (node: ReactNode) => void;
}
