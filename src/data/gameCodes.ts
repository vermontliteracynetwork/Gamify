import { newJoinCode } from '../auth/session';
import { data } from './index';

// Game codes (development plan Part 3B, path 2): the teacher picks a set and
// a game, Gamify makes a letters-only code and a link with it built in.
// Saved on this device until cloud accounts (Stage 5) share them.
export interface GameCode { code: string; gameId: string; setId: string; createdAt: string }
const KEY = 'game-codes';
// Game codes stop working after two weeks (development plan Stage 5:
// codes expire), so an old code on a board can't be reused by strangers.
export const GAME_CODE_DAYS = 14;
const fresh = (c: GameCode, now = Date.now()) => now - Date.parse(c.createdAt) < GAME_CODE_DAYS * 86400000;

export async function listGameCodes(): Promise<GameCode[]> {
  return ((await data.getSetting<GameCode[]>(KEY)) ?? []).filter((c) => fresh(c));
}

export async function makeGameCode(gameId: string, setId: string): Promise<GameCode> {
  const all = await listGameCodes();
  const same = all.find((c) => c.gameId === gameId && c.setId === setId);
  if (same) return same;
  const classCodes = (await data.listClassrooms()).map((c) => c.joinCode ?? '');
  const code: GameCode = { code: newJoinCode([...classCodes, ...all.map((c) => c.code)]), gameId, setId, createdAt: new Date().toISOString() };
  await data.setSetting(KEY, [...all, code]);
  return code;
}

export async function findGameCode(code: string): Promise<GameCode | undefined> {
  return (await listGameCodes()).find((c) => c.code === code.toUpperCase());
}

export const gameLink = (c: GameCode) => `${window.location.origin}/join/${c.code}`;
