import { matchThreeManifest } from './match-three/manifest';
import { fourInARowManifest } from './four-in-a-row/manifest';
import { gameShowManifest } from './game-show/manifest';
import { starQuizManifest } from './practice/manifest';
import { castCatchManifest } from './cast-catch/manifest';
import { memoryMatchManifest } from './memory-match/manifest';
import { flashcardsManifest } from './flashcards/manifest';
import { matchUpManifest } from './match-up/manifest';
import { pegDropManifest } from './peg-drop/manifest';
import { bubblePopManifest } from './bubble-pop/manifest';
import { bowlingManifest } from './bowling/manifest';
import { roadHopManifest } from './road-hop/manifest';
import { lunchRushManifest } from './lunch-rush/manifest';
import type { GameManifest } from './types';

// Every game built, in Arcade order (development plan Part 4).
export const ALL_GAMES: GameManifest[] = [gameShowManifest, pegDropManifest, castCatchManifest, matchThreeManifest, fourInARowManifest, memoryMatchManifest, matchUpManifest, bubblePopManifest, bowlingManifest, roadHopManifest, lunchRushManifest, starQuizManifest, flashcardsManifest];

// For now the lineup is only games where multiple-choice questions interrupt
// play, with an easy re-theme and power-ups (teacher, 2026-10-26). Games where
// the questions are the game (matching, memory, flashcards) and Road Hop come
// later; their code and links stay, they are just not listed.
export const LATER_GAMES = ['memory-match', 'match-up', 'road-hop', 'flashcards'];
export const GAMES: GameManifest[] = ALL_GAMES.filter((g) => !LATER_GAMES.includes(g.id));

export function getGame(id: string): GameManifest | undefined {
  return ALL_GAMES.find((g) => g.id === id);
}

// Checks every manifest; used by tests and in development.
export function manifestProblems(games: GameManifest[]): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  for (const g of games) {
    if (ids.has(g.id)) problems.push(`Duplicate game id: ${g.id}`);
    ids.add(g.id);
    if (!/^[a-z0-9-]+$/.test(g.id)) problems.push(`${g.id}: ids are lowercase words with dashes`);
    if (g.modes.length === 0) problems.push(`${g.id}: needs at least one play mode`);
    if (g.themePieces.length === 0) problems.push(`${g.id}: needs at least one theme piece`);
    const pieceIds = new Set(g.themePieces.map((p) => p.id));
    if (pieceIds.size !== g.themePieces.length) problems.push(`${g.id}: duplicate theme piece ids`);
    for (const r of [g.rounds, g.questionsPerBreak]) {
      if (r && !(r.min <= r.default && r.default <= r.max)) problems.push(`${g.id}: ${r.label} default is outside its range`);
    }
  }
  return problems;
}
