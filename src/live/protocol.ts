import { openChannel } from './channel';

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
}

export type ToHost =
  | { t: 'hello'; pid: string }
  | { t: 'join'; pid: string; name: string }
  | { t: 'leave'; pid: string }
  | { t: 'progress'; pid: string; round: number; answered: number; right: number; askedAt: number | null };
export type ToPlayers = { t: 'state'; state: LiveState } | { t: 'closed'; pid: string };
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
