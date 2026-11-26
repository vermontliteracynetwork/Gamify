import { useCallback, useEffect, useState } from 'react';
import { data } from '../data';
import { easternToday } from './tags';

// The Theme Building Challenge's ongoing public vote (owner, 2026-11-26):
// anyone with the link picks a top 3 (each pick counts the same) once per
// device per day for each special day, and each class can cast one group vote
// a day from the teacher's account. Kept on this device until cloud accounts
// share themes and votes with every visitor (Stage 5).
const KEY = 'challenge-votes';
export const MAX_PICKS = 3;

interface Ballot { date: string; day: string; picks: string[]; classId?: string }
export interface VoteStore { ballots: Ballot[] }

export async function loadVotes(): Promise<VoteStore> {
  return (await data.getSetting<VoteStore>(KEY)) ?? { ballots: [] };
}

export function tally(store: VoteStore, day: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const b of store.ballots) if (b.day === day) for (const id of b.picks) out[id] = (out[id] ?? 0) + 1;
  return out;
}

// Has this device (or this class) already voted today for this special day?
export function votedToday(store: VoteStore, day: string, classId?: string, today = easternToday()): boolean {
  return store.ballots.some((b) => b.day === day && b.date === today && (b.classId ?? '') === (classId ?? ''));
}

export async function castVote(day: string, picks: string[], classId?: string, today = easternToday()): Promise<VoteStore> {
  const store = await loadVotes();
  const clean = [...new Set(picks)].slice(0, MAX_PICKS);
  if (!clean.length || votedToday(store, day, classId, today)) return store;
  const next = { ballots: [...store.ballots, { date: today, day, picks: clean, ...(classId ? { classId } : {}) }] };
  await data.setSetting(KEY, next);
  return next;
}

export function useVotes() {
  const [store, setStore] = useState<VoteStore>({ ballots: [] });
  const reload = useCallback(() => { void loadVotes().then(setStore); }, []);
  useEffect(reload, [reload]);
  return { store, setStore };
}

// The winner the owner picks from the top 10 for each special day (owner,
// 2026-11-26). Shown at 12:00 am Eastern on the day, with the rest of the top
// 10 listed under it (no honorable mentions).
const WINNERS = 'challenge-winners';
export async function loadWinners(): Promise<Record<string, string>> {
  return (await data.getSetting<Record<string, string>>(WINNERS)) ?? {};
}
export async function saveWinner(day: string, themeId: string | null): Promise<Record<string, string>> {
  const all = { ...(await loadWinners()) };
  if (themeId) all[day] = themeId; else delete all[day];
  await data.setSetting(WINNERS, all);
  return all;
}
export function useWinners() {
  const [winners, setWinners] = useState<Record<string, string>>({});
  useEffect(() => { void loadWinners().then(setWinners); }, []);
  return { winners, setWinners };
}

// The top 10 by votes (ties keep the earlier entry first).
export function topTen<T extends { id: string }>(entries: T[], counts: Record<string, number>): T[] {
  return [...entries].sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0)).slice(0, 10);
}
