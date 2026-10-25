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
import type { GameManifest } from './types';

// All games, in the order they show in the Arcade. Games are added here as
// they're built (development plan Part 4).
export const GAMES: GameManifest[] = [gameShowManifest, pegDropManifest, castCatchManifest, matchThreeManifest, fourInARowManifest, memoryMatchManifest, matchUpManifest, bubblePopManifest, bowlingManifest, starQuizManifest, flashcardsManifest];

export function getGame(id: string): GameManifest | undefined {
  return GAMES.find((g) => g.id === id);
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
