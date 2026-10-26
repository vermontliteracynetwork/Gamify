import { openChannel } from './channel';
import type { QuestionSet } from '../data/types';

// Class Live (development plan Stage 6): one host screen, every student on
// their own device. Messages travel over a LiveLink: across tabs on one
// device today (BroadcastChannel), across devices once the cloud connects
// (Stage 5), with the same messages. Nothing here is shown on a projector
// except names and scores.

export type PlayerStatus = 'pending' | 'in' | 'removed';
export interface LivePlayer { pid: string; name: string; status: PlayerStatus; answered: number; right: number; askedAt: number | null; lastSeen: number }
export type LivePhase = 'lobby' | 'play' | 'paused' | 'ended';
export interface LiveState {
  code: string; gameId: string; setId: string; phase: LivePhase;
  players: LivePlayer[]; locks: Record<string, string>; roomLocked: boolean; at: number;
  // A new round (Play again) starts every student's count from zero.
  round: number;
  // How the class plays (teacher, 2026-10-26): against each other on a
  // leaderboard, or together toward a class goal of right answers.
  mode?: 'compete' | 'together';
  goal?: number;
  // Groups, each playing its own game (Plus, Homeschool and Pro), and each
  // student's group and question set (their own level, same game).
  groups?: { gameId: string }[];
  assign?: Record<string, { group?: number; setId?: string }>;
}

// Where one student goes when the game starts: their group's game with their
// own set. In a two-player game the group plays in pairs (seat 0 hosts); an
// odd one out plays the computer.
export function routeFor(s: LiveState, pid: string): { gameId: string; setId: string; pair?: { code: string; seat: 0 | 1 } } {
  const a = s.assign?.[pid] ?? {};
  const g = Math.min(a.group ?? 0, (s.groups?.length ?? 1) - 1);
  const gameId = s.groups?.[g]?.gameId ?? s.gameId;
  const setId = a.setId ?? s.setId;
  if (gameId !== 'four-in-a-row') return { gameId, setId };
  const members = s.players.filter((p) => p.status === 'in' && Math.min(s.assign?.[p.pid]?.group ?? 0, (s.groups?.length ?? 1) - 1) === g).map((p) => p.pid);
  const i = members.indexOf(pid);
  const pairIdx = Math.floor(i / 2);
  if (i < 0 || (i % 2 === 0 && i === members.length - 1)) return { gameId, setId };
  return { gameId, setId, pair: { code: `${s.code}-${s.round}-${g}-${pairIdx}`, seat: (i % 2) as 0 | 1 } };
}

export type ToHost =
  | { t: 'hello'; pid: string }
  | { t: 'join'; pid: string; name: string }
  | { t: 'leave'; pid: string }
  | { t: 'progress'; pid: string; round: number; answered: number; right: number; askedAt: number | null };
// Question sets go out once (not in every state update): each student's own.
export type ToPlayers = { t: 'state'; state: LiveState } | { t: 'closed'; pid: string } | { t: 'sets'; sets: QuestionSet[] };
export type LiveMsg = ToHost | ToPlayers;

export interface LiveLink { send(msg: LiveMsg): void; listen(fn: (msg: LiveMsg) => void): () => void; close(): void }

// One channel per room code: same-device tabs, and other devices once cloud
// accounts are on (src/live/channel.ts).
export function openLink(code: string): LiveLink {
  return openChannel<LiveMsg>(`live-${code}`);
}

// The leaderboard: most right answers first, then fewest answered (accuracy).
export const ranked = (players: LivePlayer[]) => players.filter((p) => p.status === 'in').sort((a, b) => b.right - a.right || a.answered - b.answered || a.name.localeCompare(b.name));

// Fold one student message into the host's state (pure, so it is tested).
export function reduceHost(s: LiveState, m: ToHost, approveNames: boolean, now = Date.now()): LiveState {
  const find = (pid: string) => s.players.find((p) => p.pid === pid);
  switch (m.t) {
    case 'join': {
      const name = m.name.trim().slice(0, 24);
      if (find(m.pid)) return { ...s, players: s.players.map((p) => (p.pid === m.pid && p.status !== 'removed' ? { ...p, lastSeen: now } : p)), at: now };
      if (s.roomLocked || !name) return s;
      return { ...s, players: [...s.players, { pid: m.pid, name, status: approveNames ? 'pending' : 'in', answered: 0, right: 0, askedAt: null, lastSeen: now }], at: now };
    }
    case 'leave': return { ...s, players: s.players.filter((p) => p.pid !== m.pid || p.status === 'removed'), at: now };
    case 'progress': if (m.round !== s.round) return s; return { ...s, players: s.players.map((p) => (p.pid === m.pid ? { ...p, answered: m.answered, right: m.right, askedAt: m.askedAt, lastSeen: now } : p)), at: now };
    default: return s;
  }
}
