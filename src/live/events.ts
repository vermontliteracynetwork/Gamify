import { data } from '../data';

// Live game events kept for the teacher's reports (development plan Stage 6:
// Lock is "logged in reports"): who was locked or unlocked, when, and why.
export interface LiveEvent { at: string; code: string; gameId: string; kind: 'lock' | 'unlock'; who: string; message?: string }
const KEY = 'live-events';
const KEEP = 500;

export async function logLiveEvent(e: LiveEvent) {
  const all = (await data.getSetting<LiveEvent[]>(KEY)) ?? [];
  await data.setSetting(KEY, [...all, e].slice(-KEEP));
}
export async function listLiveEvents(): Promise<LiveEvent[]> {
  return ((await data.getSetting<LiveEvent[]>(KEY)) ?? []).slice().reverse();
}
